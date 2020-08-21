'use strict'

/*
 * Testing the cryptoStore.updateOrAdd method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.updateOrAdd(id, object) updates existing', async t => {
  t.plan(8)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.store.add({ _id: 'notEncrypted', foo: 'bar' })
    await hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar' })

    const notEncrypted = await hoodie.cryptoStore.updateOrAdd('notEncrypted', { foo: 'baz' })
    t.is(notEncrypted._id, 'notEncrypted', 'resolves with id')
    t.is(notEncrypted.foo, 'baz', 'resolves with new object')

    const encrypted = await hoodie.cryptoStore.updateOrAdd('encrypted', { foo: 'baz' })
    t.is(encrypted._id, 'encrypted', 'resolves with id')
    t.is(encrypted.foo, 'baz', 'resolves with new object')

    const objects = await hoodie.store.find(['notEncrypted', 'encrypted'])

    t.is(objects[0].foo, undefined, 'stored doc 0 has no foo')
    t.ok(objects[0].data, 'stored doc 0 has encrypted data')

    t.is(objects[1].foo, undefined, 'stored doc 1 has no foo')
    t.ok(objects[1].data, 'stored doc 1 has encrypted data')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.updateOrAdd(id, object) adds new if non-existent', async t => {
  t.plan(6)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const object = await hoodie.cryptoStore.updateOrAdd('newid', { foo: 'baz' })
    t.is(object._id, 'newid', 'resolves with id')
    t.is(object.foo, 'baz', 'resolves with new object')

    const encrypted = await hoodie.store.find('newid')
    // object is encrypted
    t.is(encrypted.foo, undefined, 'stored doc has no foo')
    t.ok(encrypted.data, 'has encrypted data')
    t.ok(encrypted.tag, 'has tag')
    t.ok(encrypted.nonce, 'has nonce')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.updateOrAdd(id) fails with 400 error', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.updateOrAdd('id')
    t.fail("updateOrAdd didn't fail")
  } catch (error) {
    t.is(error.status, 400, 'rejects with invalid request error')
  }
})

test('cryptoStore.updateOrAdd(object) updates existing', async t => {
  t.plan(8)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.store.add({ _id: 'notEncrypted', foo: 'bar' })
    await hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar' })

    const notEncrypted = await hoodie.cryptoStore.updateOrAdd({ _id: 'notEncrypted', foo: 'baz' })
    t.is(notEncrypted._id, 'notEncrypted', 'resolves with id')
    t.is(notEncrypted.foo, 'baz', 'resolves with new object')

    const encrypted = await hoodie.cryptoStore.updateOrAdd({ _id: 'encrypted', foo: 'baz' })
    t.is(encrypted._id, 'encrypted', 'resolves with id')
    t.is(encrypted.foo, 'baz', 'resolves with new object')

    const objects = await hoodie.store.find(['notEncrypted', 'encrypted'])

    t.is(objects[0].foo, undefined, 'stored doc 0 has no foo')
    t.ok(objects[0].data, 'stored doc 0 has encrypted data')

    t.is(objects[1].foo, undefined, 'stored doc 1 has no foo')
    t.ok(objects[1].data, 'stored doc 1 has encrypted data')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.updateOrAdd(object) adds new if non-existent', async t => {
  t.plan(6)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const object = await hoodie.cryptoStore.updateOrAdd({ _id: 'newid', foo: 'baz' })

    t.is(object._id, 'newid', 'resolves with id')
    t.is(object.foo, 'baz', 'resolves with new object')

    const encrypted = await hoodie.store.find('newid')
    // object is encrypted
    t.is(encrypted.foo, undefined, 'stored doc has no foo')
    t.ok(encrypted.data, 'has encrypted data')
    t.ok(encrypted.tag, 'has tag')
    t.ok(encrypted.nonce, 'has nonce')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.updateOrAdd(object) without object._id fails with 400 error', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.updateOrAdd({ foo: 'bar' })
    t.fail("updateOrAdd didn't fail")
  } catch (error) {
    t.is(error.status, 400, 'rejects with invalid request error')
  }
})

test('cryptoStore.updateOrAdd(array) updates existing, adds new', async t => {
  t.plan(14)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.store.add({ _id: 'notEncrypted', foo: 'bar' })
    await hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar' })

    const objects = await hoodie.cryptoStore.updateOrAdd([
      { _id: 'notEncrypted', foo: 'baz' },
      { _id: 'encrypted', foo: 'baz' },
      { _id: 'unknown', foo: 'baz' }
    ])

    t.is(objects[0]._id, 'notEncrypted', 'object1 to be updated')
    t.is(objects[0].foo, 'baz', 'object1 to be updated')
    t.is(parseInt(objects[0]._rev, 10), 2, 'object1 has revision 2')

    t.is(objects[1]._id, 'encrypted', 'object2 to be updated')
    t.is(objects[1].foo, 'baz', 'object2 to be updated')
    t.is(parseInt(objects[1]._rev, 10), 2, 'object2 has revision 2')

    t.is(objects[2]._id, 'unknown', 'object3 to be created')
    t.is(objects[2].foo, 'baz', 'object3 to be created')

    const encrypted = await hoodie.store.find(['notEncrypted', 'encrypted', 'unknown'])

    t.is(encrypted[0].foo, undefined, 'stored doc 1 has no foo')
    t.ok(encrypted[0].data, 'stored doc 1 has encrypted data')

    t.is(encrypted[1].foo, undefined, 'stored doc 2 has no foo')
    t.ok(encrypted[1].data, 'stored doc 2 has encrypted data')

    t.is(encrypted[2].foo, undefined, 'stored doc 3 has no foo')
    t.ok(encrypted[2].data, 'stored doc 3 has encrypted data')
  } catch (err) {
    t.end(err)
  }
})

test(
  "cryptoStore.updateOrAdd() shouldn't encrypt fields in cy_ignore and __cy_ignore",
  async t => {
    t.plan(12)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      const obj = await hoodie.cryptoStore.updateOrAdd({
        _id: 'an_id',
        value: 42,
        notEncrypted: 'other',
        notEncryptedTemp: true,
        cy_ignore: ['notEncrypted'],
        __cy_ignore: ['notEncryptedTemp']
      })
      t.is(obj.__cy_ignore, undefined, '__cy_ignore was not saved')

      const encrypted = await hoodie.store.find(obj._id)
      t.is(encrypted.notEncrypted, 'other', 'fields listed in cy_ignore was not encrypted')
      t.is(encrypted.notEncryptedTemp, true, 'fields listed in __cy_ignore was not encrypted')

      const updated = await hoodie.cryptoStore.updateOrAdd(encrypted._id, {
        other: 789,
        __cy_ignore: ['value']
      })

      t.is(updated.value, 42, 'value exists')
      t.is(updated.other, 789, 'later added value exists')
      t.is(updated.notEncrypted, 'other', 'notEncrypted value as merged')
      t.is(updated.notEncryptedTemp, true, 'notEncryptedTemp exists')

      t.deepEqual(updated.cy_ignore, ['notEncrypted'], 'cy_ignore was saved')
      t.is(updated.__cy_ignore, undefined, '__cy_ignore was not saved')

      const updatedEncrypted = await hoodie.store.find(updated._id)
      t.is(updatedEncrypted.value, 42, 'encrypted value listed in __cy_ignore was decrypted')
      t.is(
        updatedEncrypted.notEncryptedTemp,
        undefined,
        'not encrypted value was encrypted and deleted'
      )
      t.is(updatedEncrypted.other, undefined, 'later added value was saved encrypted')
    } catch (err) {
      t.end(err)
    }
  }
)

test("cryptoStore.updateOrAdd() shouldn't encrypt fields starting with _", async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const obj = await hoodie.cryptoStore.updateOrAdd({
      _id: 'an_id',
      other: 42
    })
    await hoodie.cryptoStore.updateOrAdd(obj._id, {
      _value: 'test value'
    })

    t.fail(new Error('should have thrown with doc_validation'))
  } catch (err) {
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }
})

test('cryptoStore.updateOrAdd() should throw if plugin isn\'t unlocked', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.updateOrAdd('anId', { value: 'something' })
    t.fail('It should have thrown')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  try {
    await hoodie.cryptoStore.setup('test')

    await hoodie.cryptoStore.updateOrAdd('anId', { value: 'something' })
    t.fail('It should have thrown after setup')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  t.end()
})
