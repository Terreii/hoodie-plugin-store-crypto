'use strict'

const test = require('tape')
const Promise = require('lie')
const randomBytes = require('randombytes')
const pouchDbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')
const createKey = require('../../lib/create-key')
const decrypt = require('../../lib/decrypt-doc')

test('resetPassword() should exist on the cryptoStores main API', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  t.equal(typeof hoodie.cryptoStore.resetPassword, 'function', 'resetPassword exists')

  t.equal(
    hoodie.cryptoStore.withIdPrefix('test').resetPassword,
    undefined,
    'withIdPrefix does not have resetPassword'
  )

  try {
    const result = await hoodie.cryptoStore.withPassword('test')
    t.equal(result.store.resetPassword, undefined, 'withPassword does not have resetPassword')
  } catch (err) {
    t.end(err)
  }
})

test(
  'cryptoStore.resetPassword(resetKey, newPassword) results with new reset keys, salt and not' +
    ' updated docs',
  async t => {
    t.plan(10)

    const hoodie = createCryptoStore()

    try {
      const resetKeys = await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      await hoodie.cryptoStore.add({ value: 42 })

      const withPassword = await hoodie.cryptoStore.withPassword('otherPassword')
      await withPassword.store.add({
        _id: 'doNotUpdate',
        value: 'secret'
      })
      const { salt: oldSalt } = await hoodie.store.find('hoodiePluginCryptoStore/salt')

      hoodie.cryptoStore.lock()
      const resetKey = getRandomItemOfArray(resetKeys)
      const report = await hoodie.cryptoStore.resetPassword(resetKey, 'newPassword')

      // new salt
      t.is(typeof report.salt, 'string', 'salt is a string')
      t.is(report.salt.length, 32, 'salt has the correct length')

      // notUpdated Array
      t.ok(Array.isArray(report.notUpdated), 'has a array of not updated IDs')
      t.is(report.notUpdated.length, 1, 'array has a length of 0')
      t.is(report.notUpdated[0], 'doNotUpdate', 'doNotUpdate doc was not updated')

      // new reset keys
      t.is(report.resetKeys.length, 10, 'results with reset keys')

      t.ok(
        report.resetKeys.every(key => typeof key === 'string' && key.length === 32),
        'every key has a length of 32'
      )

      t.ok(
        report.resetKeys.every(key => resetKeys.indexOf(key) === -1),
        'every resetKey is new'
      )

      const saltObj = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.is(saltObj.salt, report.salt, 'stored salt was updated')
      t.notEqual(report.salt, oldSalt, 'new salt is not the old salt')
    } catch (err) {
      t.end(err)
    }
  }
)

test('cryptoStore.resetPassword(resetKey, newPassword) changes the encryption', async t => {
  t.plan(7)

  const hoodie = createCryptoStore()

  try {
    const resetKeys = await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
    const oldKey = await createKey('test', saltDoc.salt)

    await hoodie.store.add({
      _id: 'not-encrypted',
      value: 42
    })
    await hoodie.cryptoStore.add({
      _id: 'encrypted',
      value: 'secret'
    })

    hoodie.cryptoStore.lock()

    const resetKey = getRandomItemOfArray(resetKeys)

    await hoodie.cryptoStore.resetPassword(resetKey, 'nextPassword')
    const newSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
    t.ok(/^2-/.test(newSaltDoc._rev), 'salt doc was updated')
    const newKey = await createKey('nextPassword', newSaltDoc.salt)

    const doc = await hoodie.cryptoStore.find('encrypted')
    t.equal(doc.value, 'secret', 'encrypted doc was decrypted by hoodie.cryptoStore.find')
    t.ok(/^2-/.test(doc._rev), 'encrypted doc was updated')

    const [unEncryptedDoc, encryptedDoc] = await hoodie.store.find(['not-encrypted', 'encrypted'])

    t.ok(/^1-/.test(unEncryptedDoc._rev), 'not encrypted doc was not updated')
    t.equal(unEncryptedDoc.value, 42, 'not encrypted doc is not encrypted')

    try {
      await decrypt(oldKey, encryptedDoc)
      t.fail('encryption of the encrypted doc was not updated! It was decrypted by old key!')
    } catch (err) {
      t.ok(err, 'Old encryption did error')
    }

    const decrypted = await decrypt(newKey.key, encryptedDoc)
    t.equal(decrypted.value, 'secret', 'encrypted doc was decrypted with new key')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.resetPassword() fails if the reset key is not valid', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    const resetKeys = await hoodie.cryptoStore.setup('test')
    let resetKey = null

    do {
      resetKey = randomBytes(16).toString('hex')
    } while (resetKeys.indexOf(resetKey) !== -1)

    await hoodie.cryptoStore.resetPassword(resetKey, 'otherPassword')
    t.end(new Error('resetPassword should have failed.'))
  } catch (err) {
    t.equal(err.status, pouchDbErrors.UNAUTHORIZED.status, 'fails with unauthorized')
    t.equal(err.reason, 'Reset-key is incorrect.', 'Fails with custom reason')
  }
})

test('cryptoStore.resetPassword() fails if no new password was passed', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()
  let resetKey = null

  try {
    const resetKeys = await hoodie.cryptoStore.setup('test')
    resetKey = getRandomItemOfArray(resetKeys)

    await hoodie.cryptoStore.resetPassword(resetKey)
    t.end(new Error('resetPassword should have failed.'))
  } catch (err) {
    t.equal(err.status, pouchDbErrors.BAD_ARG.status, 'fails with bar args')
    t.equal(err.reason, 'New password must be a string!', 'Fails with custom reason')

    try {
      await hoodie.cryptoStore.resetPassword(resetKey, 'a')
      t.end(new Error('resetPassword should have failed.'))
    } catch (error) {
      t.equal(error.status, pouchDbErrors.BAD_ARG.status, 'fails with bar args')
      t.equal(error.reason, 'password is to short!', 'Fails with custom reason')
    }
  }
})

test(
  'cryptoStore.resetPassword(resetKey, newPassword) should fail if the new password is to short',
  async t => {
    t.plan(2)

    const hoodie = createCryptoStore()

    try {
      const resetKeys = await hoodie.cryptoStore.setup('test')
      const resetKey = getRandomItemOfArray(resetKeys)

      await hoodie.cryptoStore.resetPassword(resetKey, 'a')
      t.end(new Error('should throw an Error'))
    } catch (error) {
      t.is(error.reason, 'password is to short!', 'fails with error message')
      t.is(error.status, pouchDbErrors.BAD_ARG.status, 'fails with a PouchDB error')
    }
  }
)

test(
  'cryptoStore.resetPassword(resetKey, newPassword) should update the check in the salt object', async t => {
    t.plan(3)

    const hoodie = createCryptoStore()

    try {
      const resetKeys = await hoodie.cryptoStore.setup('test')
      const oldSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      const resetKey = getRandomItemOfArray(resetKeys)

      await hoodie.cryptoStore.resetPassword(resetKey, 'otherPassword')
      const newSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')

      t.notEqual(newSaltDoc.check.tag, oldSaltDoc.check.tag, 'tag should not be equal')
      t.notEqual(newSaltDoc.check.data, oldSaltDoc.check.data, 'data should not be equal')
      t.notEqual(newSaltDoc.check.nonce, oldSaltDoc.check.nonce, 'nonce should not be equal')
    } catch (err) {
      t.end(err)
    }
  }
)

test('cryptoStore.resetPassword(resetKey, newPassword) should update reset docs', async t => {
  t.plan(16)

  const hoodie = createCryptoStore()

  try {
    const resetKeys = await hoodie.cryptoStore.setup('test')
    const resetKey = getRandomItemOfArray(resetKeys)

    const result = await hoodie.cryptoStore.resetPassword(resetKey, 'otherPassword')

    const docs = await hoodie.store.withIdPrefix('hoodiePluginCryptoStore/pwReset').findAll()

    t.ok(
      docs.every((doc, index) => doc._id === 'hoodiePluginCryptoStore/pwReset_' + index),
      'have correct _id\'s'
    )

    t.ok(
      docs.every(doc => /^2-/.test(doc._rev)),
      'reset docs were updated'
    )

    t.ok(
      docs.every(doc => doc.salt.length === 32),
      'have correct salt lengths'
    )

    t.ok(
      docs.every(doc => doc.tag.length === 32),
      'have a tag part with a length of 32'
    )

    t.ok(
      docs.every(doc => doc.data.length > 0),
      'should have encrypted data'
    )

    t.ok(
      docs.every(doc => doc.nonce.length === 24),
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

test('cryptoStore.resetPassword() should only update objects that it can decrypt', async t => {
  t.plan(7)

  const hoodie = createCryptoStore()

  try {
    const resetKeys = await hoodie.cryptoStore.setup('test')
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

    const resetKey = getRandomItemOfArray(resetKeys)
    const report = await hoodie.cryptoStore.resetPassword(resetKey, 'nextPassword')
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

// Utils

function getRandomItemOfArray (array) {
  const index = Math.floor(array.length * Math.random())

  return array[index]
}
