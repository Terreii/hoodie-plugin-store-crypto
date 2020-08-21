'use strict'

/*
 * Testing the cryptoStore.findOrAdd method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.findOrAdd(id, object) finds existing', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'exists', foo: 'bar' })

    const object = await hoodie.cryptoStore.findOrAdd('exists', { foo: 'baz' })
    t.is(object._id, 'exists', 'resolves with id')
    t.is(object.foo, 'bar', 'resolves with old object')

    await hoodie.store.add({ _id: 'not-encrypted', foo: 'bar' })

    const notEncrypted = await hoodie.cryptoStore.findOrAdd('not-encrypted', { foo: 'baz' })
    t.is(notEncrypted._id, 'not-encrypted', 'resolves with id')
    t.is(notEncrypted.foo, 'bar', 'resolves with old object')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.findOrAdd(id, object) adds new', async t => {
  t.plan(5)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const object = await hoodie.cryptoStore.findOrAdd('newId', { foo: 'bar' })

    t.is(object._id, 'newId', 'resolves with id')
    t.is(object.foo, 'bar', 'resolves with new object')

    const notEncrypted = await hoodie.store.find(object._id)
    t.is(notEncrypted._id, 'newId', 'resolves with id')
    t.ok(notEncrypted.data, 'has encrypted data')
    t.is(notEncrypted.foo, undefined, 'stored doc has no foo')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.findOrAdd(id) fails if no object exists', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.findOrAdd('an-id')
    t.end(new Error("findOrAdd didn't fail"))
  } catch (err) {
    t.is(err.status, 412, 'rejects with 412 error')
  }
})

test('cryptoStore.findOrAdd(object) finds existing', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar' })

    const object = await hoodie.cryptoStore.findOrAdd({ _id: 'encrypted', foo: 'baz' })
    t.is(object._id, 'encrypted', 'resolves with id')
    t.is(object.foo, 'bar', 'resolves with old object')

    await hoodie.store.add({ _id: 'not-encrypted', foo: 'bar' })
    const notEncrypted = await hoodie.cryptoStore.findOrAdd({ _id: 'not-encrypted', foo: 'baz' })
    t.is(notEncrypted._id, 'not-encrypted', 'resolves with id')
    t.is(notEncrypted.foo, 'bar', 'resolves with old object')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.findOrAdd(object) adds new', async t => {
  t.plan(5)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const object = await hoodie.cryptoStore.findOrAdd({ _id: 'newId', foo: 'bar' })
    t.is(object._id, 'newId', 'resolves with id')
    t.is(object.foo, 'bar', 'resolves with new object')

    const encrypted = await hoodie.store.find(object._id)
    t.is(encrypted._id, 'newId', 'resolves with id')
    t.ok(encrypted.data, 'has encrypted data')
    t.is(encrypted.foo, undefined, 'stored doc has no foo')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.findOrAdd(object) fails if object has no id', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.findOrAdd({ foo: 'bar' })
    t.end(new Error("findOrAdd didn't fail"))
  } catch (err) {
    t.is(err.status, 412, 'rejects with 412 error')
  }
})

test('cryptoStore.findOrAdd([object1, object2])', async t => {
  t.plan(8)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar' })
    await hoodie.store.add({ _id: 'not-encrypted', foo: 'bar' })

    const objects = await hoodie.cryptoStore.findOrAdd([
      { _id: 'encrypted', foo: 'baz' },
      { _id: 'not-encrypted', foo: 'baz' },
      { _id: 'added', foo: 'baz' }
    ])

    t.is(objects[0]._id, 'encrypted', 'object1 to be found')
    t.is(objects[0].foo, 'bar', 'object1 to be found')

    t.is(objects[1]._id, 'not-encrypted', 'object2 to be found')
    t.is(objects[1].foo, 'bar', 'object2 to be found')

    t.is(objects[2]._id, 'added', 'object3 to be found')
    t.is(objects[2].foo, 'baz', 'object3 to be found')

    const object = await hoodie.store.find('added')
    t.ok(object.data, 'has encrypted data')
    t.is(object.foo, undefined, 'stored doc has no foo')
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.findOrAdd() shouldn't encrypt fields in cy_ignore and __cy_ignore", async t => {
  t.plan(8)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const obj = await hoodie.cryptoStore.findOrAdd({
      _id: 'an_id',
      value: 42,
      notEncrypted: 'other',
      notEncryptedTemp: true,
      cy_ignore: ['notEncrypted'],
      __cy_ignore: ['notEncryptedTemp']
    })

    t.deepEqual(obj.cy_ignore, ['notEncrypted'], 'cy_ignore was saved')
    t.is(obj.__cy_ignore, undefined, '__cy_ignore was not saved')

    const object = await hoodie.store.find(obj._id)
    t.is(object.notEncrypted, 'other', 'field in cy_ignore was not encrypted')
    t.is(object.notEncryptedTemp, true, 'field in __cy_ignore was not encrypted')

    const foundObject = await hoodie.cryptoStore.findOrAdd(obj)
    t.is(foundObject.value, 42, 'value was encrypted')
    t.is(foundObject.notEncrypted, 'other', 'not encrypted fields are merged in')
    t.is(foundObject.notEncryptedTemp, true, 'not encrypted fields are merged in')
    t.deepEqual(foundObject.cy_ignore, ['notEncrypted'], 'cy_ignore is saved')
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.findOrAdd() shouldn't encrypt fields starting with _", async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.findOrAdd({
      _id: 'someId',
      value: 42,
      _other: 'test value'
    })
    t.fail(new Error('should have thrown with doc_validation'))
  } catch (err) {
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }
})

test('cryptoStore.findOrAdd() should throw if plugin isn\'t unlocked', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.findOrAdd('anId', { value: 'something' })
    t.fail('It should have thrown')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  try {
    await hoodie.cryptoStore.setup('test')

    await hoodie.cryptoStore.findOrAdd('anId', { value: 'something' })
    t.fail('It should have thrown after setup')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  t.end()
})
