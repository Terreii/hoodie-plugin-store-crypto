'use strict'

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.decrypt() exists', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.decrypt, 'function', 'decrypt exists on the main API export')
  t.is(hoodie.cryptoStore.decrypt.length, 2, 'decrypt has two arguments')

  t.is(
    hoodie.cryptoStore.withIdPrefix('test/').decrypt,
    undefined,
    'decrypt does not exist on withIdPrefix'
  )

  const { store } = await hoodie.cryptoStore.withPassword('testPassword')
  t.is(typeof store.decrypt, 'function', 'decrypt exists on the withPassword API')
})

test('cryptoStore.decrypt() should decrypt objects', async t => {
  t.plan(6)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt({ test: 'value', other: 3 })

    const object = await hoodie.cryptoStore.decrypt(encrypted)

    t.is(typeof object, 'object', 'decrypt results an object')
    t.is(object.test, 'value', 'test value should be decrypted')
    t.is(object.other, 3, 'other value should be decrypted')

    t.is(object.tag, undefined, 'tag should not be present')
    t.is(object.data, undefined, 'encrypted should not be present')
    t.is(object.nonce, undefined, 'nonce should not be present')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.decrypt() should ignore other fields on the encryption object', async t => {
  t.plan(5)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt({ test: 'value', other: 3 })
    encrypted.laterAdded = 'hello world'
    encrypted._id = 'abcdef'

    const object = await hoodie.cryptoStore.decrypt(encrypted)

    t.is(typeof object, 'object', 'decrypt results an object')
    t.is(object.test, 'value', 'test value should be decrypted')
    t.is(object.other, 3, 'other value should be decrypted')

    t.is(object.laterAdded, undefined, 'other field "laterAdded" should not be present')
    t.is(object._id, undefined, 'other field "_id" should not be present')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.decrypt() should decrypt arrays', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt(['value', 3])

    const decrypted = await hoodie.cryptoStore.decrypt(encrypted)

    t.ok(Array.isArray(decrypted), 'decrypt results in an array')
    t.deepEqual(decrypted, ['value', 3], 'The array with its values was decrypted')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.decrypt() should decrypt strings', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt('value')

    const decrypted = await hoodie.cryptoStore.decrypt(encrypted)

    t.is(typeof decrypted, 'string', 'decrypt results in a string')
    t.is(decrypted, 'value', 'it is the save string')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.decrypt() should decrypt numbers', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt(42)

    const decrypted = await hoodie.cryptoStore.decrypt(encrypted)

    t.is(typeof decrypted, 'number', 'decrypted results in a number')
    t.is(decrypted, 42, 'it is the same number')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.decrypt() should decrypt booleans', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encryptedTrue = await hoodie.cryptoStore.encrypt(true)
    const decryptedTrue = await hoodie.cryptoStore.decrypt(encryptedTrue)
    t.is(decryptedTrue, true, 'decrypt results in true')

    const encryptedFalse = await hoodie.cryptoStore.encrypt(false)
    const decryptedFalse = await hoodie.cryptoStore.decrypt(encryptedFalse)
    t.is(decryptedFalse, false, 'decrypt results in false')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.decrypt() should decrypt null', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt(null)

    const decrypted = await hoodie.cryptoStore.decrypt(encrypted)

    t.is(decrypted, null, 'decrypt results in null')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.decrypt() fails if undefined or null is passed', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.decrypt()
    t.error(new Error("encrypt didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  }

  try {
    await hoodie.cryptoStore.decrypt(null)
    t.error(new Error("encrypt didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  }

  t.end()
})

test('cryptoStore.decrypt() fails if not an object is passed', async t => {
  t.plan(10)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.decrypt(42)
    t.error(new Error("encrypt didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  }

  try {
    await hoodie.cryptoStore.decrypt('test')
    t.error(new Error("encrypt didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  }

  try {
    await hoodie.cryptoStore.decrypt(true)
    t.error(new Error("encrypt didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  }

  try {
    await hoodie.cryptoStore.decrypt(false)
    t.error(new Error("encrypt didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  }

  try {
    await hoodie.cryptoStore.decrypt([1.5, 'test'])
    t.error(new Error("encrypt didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  }

  t.end()
})

test('cryptoStore.decrypt() fails if the object does not have all required fields', async t => {
  t.plan(6)

  const hoodie = createCryptoStore()

  await hoodie.cryptoStore.setup('test')
  await hoodie.cryptoStore.unlock('test')
  const encrypted = await hoodie.cryptoStore.encrypt({ test: 'value', other: 3 })

  try {
    // Missing tag
    await hoodie.cryptoStore.decrypt({
      data: encrypted.data,
      nonce: encrypted.nonce
    })
    t.error(new Error("encrypt didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  }

  try {
    // Missing data
    await hoodie.cryptoStore.decrypt({
      tag: encrypted.tag,
      nonce: encrypted.nonce
    })
    t.error(new Error("encrypt didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  }

  try {
    // Missing tag nonce
    await hoodie.cryptoStore.decrypt({
      tag: encrypted.tag,
      data: encrypted.data
    })
    t.error(new Error("encrypt didn't fail"))
  } catch (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  }

  t.end()
})

test('cryptoStore.decrypt(obj, aad) should validate aad', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const encrypted = await hoodie.cryptoStore.encrypt('test', 'added data')
    const decrypted = await hoodie.cryptoStore.decrypt(encrypted, 'added data')
    t.is(decrypted, 'test', 'encrypted data with aad was decrypted')
  } catch (err) {
    t.error(err)
  }

  try {
    const encrypted = await hoodie.cryptoStore.encrypt('test', 'added data')
    await hoodie.cryptoStore.decrypt(encrypted)
    t.fail('It should have thrown if no aad was passed')
  } catch (err) {
    t.pass('did fail when no aad was passed to decrypt')
  }

  try {
    const encrypted = await hoodie.cryptoStore.encrypt('test', 'added data')
    await hoodie.cryptoStore.decrypt(encrypted, 'wrong aad')
    t.fail('It should have thrown if the wrong aad was passed')
  } catch (err) {
    t.pass('did fail when the wrong aad was passed to decrypt')
  }

  t.end()
})

test('cryptoStore.withPassword().decrypt() should decrypt data', async t => {
  t.plan(6)

  const hoodie = createCryptoStore()

  try {
    const { store } = await hoodie.cryptoStore.withPassword('testPassword')

    const encrypted = await store.encrypt({ test: 'value', other: 3 })

    const decrypted = await store.decrypt(encrypted)

    t.is(typeof decrypted, 'object', 'decrypt results an object')
    t.is(decrypted.test, 'value', 'test value should be decrypted')
    t.is(decrypted.other, 3, 'other value should be decrypted')

    t.is(decrypted.tag, undefined, 'tag should not be present')
    t.is(decrypted.data, undefined, 'encrypted should not be present')
    t.is(decrypted.nonce, undefined, 'nonce should not be present')
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.decrypt() should throw if plugin isn't unlocked", async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  const { store } = await hoodie.cryptoStore.withPassword('testPassword')
  const encrypted = await store.encrypt({ test: 'value', other: 3 })

  try {
    await hoodie.cryptoStore.decrypt(encrypted)
    t.fail('It should have thrown')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  try {
    await hoodie.cryptoStore.setup('testPassword')

    await hoodie.cryptoStore.encrypt(encrypted)
    t.fail('It should have thrown after setup')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  t.end()
})
