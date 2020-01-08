'use strict'

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.encrypt() exists', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.encrypt, 'function', 'encrypt exists on the main API export')
  t.is(hoodie.cryptoStore.encrypt.length, 2, 'encrypt has two arguments')

  t.is(
    hoodie.cryptoStore.withIdPrefix('test/').encrypt,
    undefined,
    'encrypt does not exist on withIdPrefix'
  )

  const { store } = await hoodie.cryptoStore.withPassword('testPassword')
  t.is(typeof store.encrypt, 'function', 'encrypt exists on the withPassword API')
})

test('cryptoStore.encrypt() should encrypt objects', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt({ test: 'value', other: 3 })

    t.is(typeof encrypted, 'object', 'encrypt results in an object')
    t.ok(encrypted.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encrypted.data.length > 0, 'encrypted data')
    t.ok(encrypted.nonce.length === 24, 'nonce should have a length of 24')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.encrypt() should encrypt arrays', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt(['value', 3])

    t.is(typeof encrypted, 'object', 'encrypt results in an object')
    t.ok(encrypted.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encrypted.data.length > 0, 'encrypted data')
    t.ok(encrypted.nonce.length === 24, 'nonce should have a length of 24')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.encrypt() should encrypt strings', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt('value')

    t.is(typeof encrypted, 'object', 'encrypt results in an object')
    t.ok(encrypted.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encrypted.data.length > 0, 'encrypted data')
    t.ok(encrypted.nonce.length === 24, 'nonce should have a length of 24')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.encrypt() should encrypt numbers', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt(42)

    t.is(typeof encrypted, 'object', 'encrypt results in an object')
    t.ok(encrypted.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encrypted.data.length > 0, 'encrypted data')
    t.ok(encrypted.nonce.length === 24, 'nonce should have a length of 24')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.encrypt() should encrypt booleans', async t => {
  t.plan(8)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encryptedTrue = await hoodie.cryptoStore.encrypt(true)

    t.is(typeof encryptedTrue, 'object', 'encrypt results in an object')
    t.ok(encryptedTrue.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encryptedTrue.data.length > 0, 'encrypted data')
    t.ok(encryptedTrue.nonce.length === 24, 'nonce should have a length of 24')

    const encryptedFalse = await hoodie.cryptoStore.encrypt(false)

    t.is(typeof encryptedFalse, 'object', 'encrypt results in an object')
    t.ok(encryptedFalse.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encryptedFalse.data.length > 0, 'encrypted data')
    t.ok(encryptedFalse.nonce.length === 24, 'nonce should have a length of 24')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.encrypt() should encrypt null', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt(null)

    t.is(typeof encrypted, 'object', 'encrypt results in an object')
    t.ok(encrypted.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encrypted.data.length > 0, 'encrypted data')
    t.ok(encrypted.nonce.length === 24, 'nonce should have a length of 24')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.encrypt() should encrypt undefined as null', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt(undefined)

    t.is(typeof encrypted, 'object', 'encrypt results in an object')
    t.ok(encrypted.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encrypted.data.length > 0, 'encrypted data')
    t.ok(encrypted.nonce.length === 24, 'nonce should have a length of 24')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.withPassword().encrypt() should encrypt data', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    const { store } = await hoodie.cryptoStore.withPassword('testPassword')

    const encrypted = await store.encrypt({ test: 'value', other: 3 })

    t.is(typeof encrypted, 'object', 'encrypt results in an object')
    t.ok(encrypted.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encrypted.data.length > 0, 'encrypted data')
    t.ok(encrypted.nonce.length === 24, 'nonce should have a length of 24')
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.encrypt() should throw if plugin isn't unlocked", async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.encrypt({ value: 'test' })
    t.fail('It should have thrown')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.encrypt({ value: 'test' })
    t.fail('It should have thrown after setup')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  t.end()
})
