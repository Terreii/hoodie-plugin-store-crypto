'use strict'

const test = require('tape')
const Promise = require('lie')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')
const createKey = require('../../lib/create-key')
const decrypt = require('../../lib/decrypt')

test('cryptoStore.changePassword should only exist on the root api', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.changePassword, 'function', 'exist on top-level')

  const prefixStore = hoodie.cryptoStore.withIdPrefix('test/')

  t.is(typeof prefixStore.changePassword, 'undefined', "doesn't exist on prefix store api")

  try {
    const { store } = await hoodie.cryptoStore.withPassword('test')
    t.is(
      typeof store.changePassword,
      'undefined',
      "doesn't exist on withPassword store api"
    )
  } catch (err) {
    t.end(err)
  }
})

test(
  'cryptoStore.changePassword(oldPassword, newPassword) should resolve with a report, including' +
    ' the new salt and an array of not updated ids and new reset keys',
  async t => {
    t.plan(7)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      const report = await hoodie.cryptoStore.changePassword('test', 'foo')

      t.is(typeof report.salt, 'string', 'salt is a string')
      t.is(report.salt.length, 32, 'salt has the correct length')
      t.ok(Array.isArray(report.notUpdated), 'has a array of not updated IDs')
      t.is(report.notUpdated.length, 0, 'array has a length of 0')

      t.is(report.resetKeys.length, 10, 'results with reset keys')
      t.ok(
        report.resetKeys.every(key => typeof key === 'string' && key.length === 32),
        'every key has a length of 32'
      )

      const saltObj = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.is(saltObj.salt, report.salt, 'stored salt was updated')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.changePassword(oldPassword, newPassword) should change the crypto key',
  async t => {
    t.plan(4)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      const object = await hoodie.cryptoStore.add({ foo: 'bar' })
      const unEncrypted = await hoodie.store.find(object._id)

      await hoodie.cryptoStore.changePassword('test', 'baz')
      await hoodie.cryptoStore.update(object)

      const updated = await hoodie.store.find(object._id)
      t.equal(unEncrypted._id, updated._id, 'id is the same')
      t.notEqual(unEncrypted.data, updated.data, 'data did change')
      t.notEqual(unEncrypted.tag, updated.tag, 'tag did change')
      t.notEqual(unEncrypted.nonce, updated.nonce, 'nonce did change')
    } catch (err) {
      t.end(err)
    }
  }
)

test('cryptoStore.changePassword(oldPassword, newPassword) should update reset docs', async t => {
  t.plan(16)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const result = await hoodie.cryptoStore.changePassword('test', 'otherPassword')
    const docs = await hoodie.store.withIdPrefix('hoodiePluginCryptoStore/pwReset').findAll()

    t.ok(
      docs.every((doc, index) => doc._id === 'hoodiePluginCryptoStore/pwReset_' + index),
      'have correct _id\'s'
    )

    t.ok(
      docs.every((doc) => /^2-/.test(doc._rev)),
      'reset docs were updated'
    )

    t.ok(
      docs.every((doc) => doc.salt.length === 32),
      'have correct salt lengths'
    )

    t.ok(
      docs.every((doc) => doc.tag.length === 32),
      'have a tag part with a length of 32'
    )

    t.ok(
      docs.every((doc) => doc.data.length > 0),
      'should have encrypted data'
    )

    t.ok(
      docs.every((doc) => doc.nonce.length === 24),
      'should have nonce with a length of 24'
    )

    const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
    const keyObj = await createKey('otherPassword', saltDoc.salt)
    const key = keyObj.key.toString('hex')

    await Promise.all(docs.map(async (doc, index) => {
      const keyObj = await createKey(result.resetKeys[index], doc.salt)
      const resetDoc = await decrypt(keyObj.key, doc)
      t.equal(resetDoc.key, key, 'encrypted data is equal to key')
    }))
  } catch (err) {
    t.end(err)
  }
})

test(
  'cryptoStore.changePassword(oldPassword, newPassword) should update existing objects',
  async t => {
    t.plan(6)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      await hoodie.cryptoStore.add({
        _id: 'testObj',
        foo: 'bar'
      })
      const oldUnEncrypted = await hoodie.store.find('testObj')

      await hoodie.cryptoStore.changePassword('test', 'foo')
      const object = await hoodie.cryptoStore.find('testObj')
      const newUnEncrypted = await hoodie.store.find('testObj')

      t.equal(oldUnEncrypted._id, newUnEncrypted._id, "_id didn't change")
      t.notEqual(oldUnEncrypted._rev, newUnEncrypted._rev, '_rev did change')
      t.notEqual(oldUnEncrypted.data, newUnEncrypted.data, 'data did change')
      t.notEqual(oldUnEncrypted.tag, newUnEncrypted.tag, 'tag did change')
      t.notEqual(oldUnEncrypted.nonce, newUnEncrypted.nonce, 'nonce did change')

      t.is(object.foo, 'bar', "data didn't change")
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.changePassword(oldPassword, newPassword) should fail if the old password' +
    " doesn't match",
  async t => {
    t.plan(1)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      await hoodie.cryptoStore.changePassword('foo', 'bar')
      t.fail('should throw an Error')
    } catch (error) {
      t.is(error.message, pouchdbErrors.UNAUTHORIZED.message, 'fails with error message')
    }
  }
)

test(
  'cryptoStore.changePassword(oldPassword, newPassword) should fail if there is no new password',
  async t => {
    t.plan(2)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      await hoodie.cryptoStore.changePassword('test')
      t.end(new Error('should throw an Error'))
    } catch (error) {
      t.is(error.message, pouchdbErrors.BAD_ARG.message, 'fails with pouchdb error')
      t.is(error.reason, 'New password must be a string!', 'fails with error message')
    }
  }
)

test(
  'cryptoStore.changePassword(oldPassword, newPassword) should fail if the new password is to short',
  async t => {
    t.plan(2)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      await hoodie.cryptoStore.changePassword('test', 'a')
      t.end(new Error('should throw an Error'))
    } catch (error) {
      t.is(error.reason, 'password is to short!', 'fails with error message')
      t.is(error.status, pouchdbErrors.BAD_ARG.status, 'fails with a PouchDB error')
    }
  }
)

test('cryptoStore.changePassword() should update the check in the salt object', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const oldSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')

    await hoodie.cryptoStore.changePassword('test', 'otherPassword')
    const newSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')

    t.notEqual(newSaltDoc.check.tag, oldSaltDoc.check.tag, 'tag should not be equal')
    t.notEqual(newSaltDoc.check.data, oldSaltDoc.check.data, 'data should not be equal')
    t.notEqual(newSaltDoc.check.nonce, oldSaltDoc.check.nonce, 'nonce should not be equal')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.changePassword() should only update objects that it can decrypt', async t => {
  t.plan(7)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'shouldUpdate',
      test: 'value'
    })
    const withPassword = await hoodie.cryptoStore.withPassword('otherPassword')
    await withPassword.store.add({
      _id: 'notUpdate',
      value: 'other'
    })

    const report = await hoodie.cryptoStore.changePassword('test', 'nextPassword')
    t.is(report.notUpdated.length, 1, 'notUpdated array has a length of 1')
    t.is(report.notUpdated[0], 'notUpdate', 'notUpdated array has the IDs')

    const updated = await hoodie.cryptoStore.find('shouldUpdate')
    t.is(updated._id, 'shouldUpdate', 'correct id')
    t.ok(/^2-/.test(updated._rev), 'revision is 2')
    t.is(updated.test, 'value', 'doc can be decrypted')

    const notUpdated = await hoodie.store.find('notUpdate')
    t.is(notUpdated._id, 'notUpdate', 'correct id')
    t.ok(/^1-/.test(notUpdated._rev), 'revision is 1')
  } catch (err) {
    t.end(err)
  }
})
