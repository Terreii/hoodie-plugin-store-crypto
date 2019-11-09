'use strict'

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.isEncrypted() exists', t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  t.equal(typeof hoodie.cryptoStore.isEncrypted, 'function', 'exists')
  t.ok(
    hoodie.cryptoStore.withIdPrefix('test/').isEncrypted == null, 'withIdPrefix doesn\'t have it.'
  )
  t.ok(
    hoodie.cryptoStore.withPassword('test').isEncrypted == null, 'withPassword doesn\'t have it.'
  )
})

test('cryptoStore.isEncrypted(doc) returns true for encrypted docs', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const doc = await hoodie.cryptoStore.add({ value: 'encrypted' })
    t.equal(hoodie.cryptoStore.isEncrypted(doc), false, 'not encrypted object')

    const encrypted = await hoodie.store.find(doc._id)
    t.equal(hoodie.cryptoStore.isEncrypted(encrypted), true, 'encrypted object')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.isEncrypted(null|undefined|string|number) throws', t => {
  t.plan(5)

  const hoodie = createCryptoStore()

  t.throws(
    () => { hoodie.cryptoStore.isEncrypted(null) },
    pouchdbErrors.NOT_AN_OBJECT.message,
    'throws on null'
  )

  t.throws(
    () => { hoodie.cryptoStore.isEncrypted(undefined) },
    pouchdbErrors.NOT_AN_OBJECT.message,
    'throws on undefined'
  )

  t.throws(
    () => { hoodie.cryptoStore.isEncrypted('test') },
    pouchdbErrors.NOT_AN_OBJECT.message,
    'throws on string'
  )

  t.throws(
    () => { hoodie.cryptoStore.isEncrypted(123) },
    pouchdbErrors.NOT_AN_OBJECT.message,
    'throws on number'
  )

  t.throws(
    () => { hoodie.cryptoStore.isEncrypted(true) },
    pouchdbErrors.NOT_AN_OBJECT.message,
    'throws on boolean'
  )
})

test('cryptoStore.isEncrypted(Promise) waits for resolving of promise', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const addPromise = hoodie.store.add({ value: 'notEncrypted' })

    const result = hoodie.cryptoStore.isEncrypted(addPromise)

    t.ok(typeof result === 'object' && typeof result.then === 'function', 'returns a promise')
    t.equal(await result, false, 'resolves to a boolean')

    const doc = await hoodie.cryptoStore.add({ value: 'encrypted' })
    const findPromise = hoodie.store.find(doc._id)

    const findResult = hoodie.cryptoStore.isEncrypted(findPromise)
    t.equal(await findResult, true, 'resolves to a boolean')
  } catch (err) {
    t.error(err)
  }

  try {
    await hoodie.cryptoStore.isEncrypted(Promise.reject(new Error('test')))
    t.fail('should have rejected on rejecting Promise')
  } catch (err) {
    t.equal(err.message, 'test', 'did reject if Promise did reject')
  }
})

test('cryptoStore.isEncrypted(Promise) rejects if promise resolves not to an object', t => {
  t.plan(5)

  const hoodie = createCryptoStore()

  const promises = [
    Promise.resolve(null),
    Promise.resolve(undefined),
    Promise.resolve(123),
    Promise.resolve('test'),
    Promise.resolve(true)
  ].map(async valuePromise => {
    try {
      await hoodie.cryptoStore.isEncrypted(valuePromise)
      t.fail("didn't reject for " + typeof value)
    } catch (err) {
      t.equal(
        err.message, pouchdbErrors.NOT_AN_OBJECT.message, 'did reject for not object promise'
      )
    }
  })

  Promise.all(promises)
    .catch(t.end)
})
