'use strict'

/*
 * Testing the cryptoStore.add method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')
const createPouchCryptoStore = require('../utils/createPouchCryptoStore')

test('cryptoStore.add() adds object to Store', async t => {
  t.plan(8)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const object = await hoodie.cryptoStore.add({ foo: 'bar' })
    t.is(object.foo, 'bar', 'resolves with value')
    t.ok(object._id, 'gets a default _id')
    t.ok(object._rev, 'gets a _rev')
    t.ok(object.hoodie, 'resolves with the hoodie object')

    const res = await hoodie.store.find(object._id)
    t.is(res.foo, undefined, 'stored doc has no foo')
    t.ok(res.data, 'has encrypted data')
    t.ok(res.tag, 'has tag')
    t.ok(res.nonce, 'has nonce')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.add() fails for invalid object', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add()
    t.end(new Error("add didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  }
})

test('fails for existing object', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'foo',
      bar: 1
    })

    await hoodie.cryptoStore.add({
      _id: 'foo',
      bar: 2
    })
    t.end(new Error("add didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 409, 'rejects with error 409')
  }
})

test('adds multiple objects to db', async t => {
  t.plan(19)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'foo',
      bar: 1
    })

    const objects = await hoodie.cryptoStore.add([
      { foo: 'bar' },
      { foo: 'baz' },
      {
        _id: 'foo',
        foo: 'baz'
      }
    ])

    t.is(objects[0].foo, 'bar', 'resolves first value')
    t.ok(objects[0]._id, 'resolves first id')
    t.ok(objects[0]._rev, 'resolves first _rev')

    t.is(objects[1].foo, 'baz', 'resolves second value')
    t.ok(objects[1]._id, 'resolves second id')
    t.ok(objects[1]._rev, 'resolves second _rev')

    t.ok(objects[2] instanceof Error, 'resolves third with error')

    const res = await hoodie.store.find([
      objects[0],
      objects[1],
      { _id: 'foo' }
    ])
    t.is(res[0].foo, undefined, 'first stored doc has no foo')
    t.ok(res[0].data, 'first has encrypted data')
    t.ok(res[0].tag, 'first has tag')
    t.ok(res[0].nonce, 'first has nonce')

    t.is(res[1].foo, undefined, 'second stored doc has no foo')
    t.ok(res[1].data, 'second has encrypted data')
    t.ok(res[1].tag, 'second has tag')
    t.ok(res[1].nonce, 'second has nonce')

    t.is(res[2].foo, undefined, 'third stored doc has no foo')
    t.ok(res[2].data, 'third has encrypted data')
    t.ok(res[2].tag, 'third has tag')
    t.ok(res[2].nonce, 'third has nonce')
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.add() shouldn't encrypt fields in cy_ignore and __cy_ignore", async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const obj = await hoodie.cryptoStore.add({
      value: 42,
      notEncrypted: 'other',
      notEncryptedTemp: true,
      cy_ignore: ['notEncrypted'],
      __cy_ignore: ['notEncryptedTemp']
    })

    t.deepEqual(obj.cy_ignore, ['notEncrypted'], 'cy_ignore was saved')
    t.is(obj.__cy_ignore, undefined, '__cy_ignore was not saved')

    const encrypted = await hoodie.store.find(obj._id)
    t.is(encrypted.notEncrypted, 'other', 'field in cy_ignore was not encrypted')
    t.is(encrypted.notEncryptedTemp, true, 'field in __cy_ignore was not encrypted')
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.add() shouldn't encrypt fields starting with _", async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')
    await hoodie.cryptoStore.add({
      value: 42,
      _other: 'test value'
    })
    t.fail('should have thrown with doc_validation')
  } catch (err) {
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }
})

test('cryptoStore.add() should throw if plugin isn\'t unlocked', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.add({ value: 'test' })
    t.fail('It should have thrown')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.add({ value: 'test' })
    t.fail('It should have thrown after setup')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  t.end()
})

test('cryptoStore.add() should work with pouchdb-hoodie-api', async t => {
  t.plan(3)

  const { db, cryptoStore } = createPouchCryptoStore()

  try {
    await cryptoStore.setup('test')
    await cryptoStore.unlock('test')

    const obj = await cryptoStore.add({ value: 'test' })
    t.is(obj.value, 'test', 'results with the value')

    const doc = await db.get(obj._id)
    t.is(obj._id, doc._id, '_id matches')
    t.is(doc.value, undefined, 'value was encrypted')
  } catch (err) {
    t.end(err)
  }
})
