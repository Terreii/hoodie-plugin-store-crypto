'use strict'

const test = require('tape')

const createCryptoStore = require('../utils/createCryptoStore')
const createPouchCryptoStore = require('../utils/createPouchCryptoStore')

test('cryptoStore has a withPassword method', t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.withPassword, 'function', 'method exist')

  const testStore = hoodie.cryptoStore.withIdPrefix('test/')

  t.is(typeof testStore.withPassword, 'undefined', "withIdPrefix store doesn't have it")
})

test('cryptoStore.withPassword returns scoped methods', async t => {
  t.plan(15)

  const hoodie = createCryptoStore()

  try {
    const result = await hoodie.cryptoStore.withPassword('test')

    ;[
      'add',
      'find',
      'findAll',
      'findOrAdd',
      'update',
      'updateOrAdd',
      'updateAll',
      'remove',
      'removeAll',
      'encrypt',
      'decrypt',
      'withIdPrefix',
      'on',
      'one',
      'off'
    ].forEach(key => {
      t.is(typeof result.store[key], 'function', 'has method: ' + key)
    })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.withPassword("test") returns salt', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    const result = await hoodie.cryptoStore.withPassword('test')

    t.is(typeof result.salt, 'string', 'returns salt')
    t.is(result.salt.length, 32, 'salt has correct length')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.withPassword("test").add(properties)', async t => {
  t.plan(5)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('foo')
    await hoodie.cryptoStore.unlock('foo')

    const { store } = await hoodie.cryptoStore.withPassword('test')

    const object = await store.add({
      _id: 'test_encrypted',
      foo: 'bar'
    })

    t.is(object._id, 'test_encrypted', 'id is unchanged')

    const encrypted = await hoodie.store.find('test_encrypted')
    t.is(encrypted.foo, undefined, 'stored doc has no foo')
    t.ok(encrypted.data, 'has encrypted data')
    t.ok(encrypted.tag, 'has tag')
    t.ok(encrypted.nonce, 'has nonce')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.withPassword("test").find(properties)', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    const { store } = await hoodie.cryptoStore.withPassword('test')

    await hoodie.cryptoStore.setup('foo')
    await hoodie.cryptoStore.unlock('foo')

    const obj = await store.add({ foo: 'bar' })

    const object = await store.find(obj._id)
    t.is(object.foo, 'bar', 'resolves value')
  } catch (err) {
    t.end(err)
  }
})

test('createCryptoStore.withPassword("test").find() fails with wrong password', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('foo')
    await hoodie.cryptoStore.unlock('foo')

    await hoodie.cryptoStore.add({
      _id: 'foo',
      bar: 'baz'
    })

    const { store } = await hoodie.cryptoStore.withPassword('test')

    await store.find('foo')
    t.fail('should throw an TypeError')
  } catch (err) {
    t.is(err.name, 'Error')
  }
})

test('cryptoStore.withPassword("test", salt) encrypts the same', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    const { store, salt } = await hoodie.cryptoStore.withPassword('test')

    await store.add({
      _id: 'foo',
      bar: 'baz'
    })

    const other = await hoodie.cryptoStore.withPassword('test', salt)

    const object = await other.store.find('foo')

    t.is(object._id, 'foo', 'resolves with id')
    t.is(object.bar, 'baz', 'resolves with values')
  } catch (err) {
    t.end(err)
  }
})

test('createCryptoStore.withPassword("test").update(properties) changes object', async t => {
  t.plan(5)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('foo')
    await hoodie.cryptoStore.unlock('foo')

    const original = await hoodie.cryptoStore.add({
      _id: 'foo',
      bar: 'baz'
    })
    const encryptedOriginal = await hoodie.store.find('foo')

    const { store } = await hoodie.cryptoStore.withPassword('test')

    await store.update(original)

    const encryptedUpdate = await hoodie.store.find('foo')

    t.equal(encryptedUpdate._id, encryptedOriginal._id, "_id didn't change")
    t.notEqual(encryptedUpdate._rev, encryptedOriginal._rev, '_rev did change')
    t.notEqual(encryptedUpdate.data, encryptedOriginal.data, 'data did change')
    t.notEqual(encryptedUpdate.tag, encryptedOriginal.tag, 'tag did change')
    t.notEqual(encryptedUpdate.nonce, encryptedOriginal.nonce, 'nonce did change')
  } catch (err) {
    t.end(err)
  }
})

test(
  'createCryptoStore.withPassword("test").on() should only emit an event for object with its password',
  async t => {
    t.plan(11)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('foo')
      await hoodie.cryptoStore.unlock('foo')

      const { store } = await hoodie.cryptoStore.withPassword('test')

      let eventCount = 0
      store.on('change', (eventName, object) => {
        switch (eventCount) {
          case 0:
            t.is(eventName, 'add', 'event is the add event')
            t.is(object._id, 'test', 'the correct object was added')
            t.is(object.bar, 'baz', 'the correct object was added')
            break

          case 1:
            t.is(eventName, 'update', 'event is a update event')
            t.is(object._id, 'foo', 'the correct object was added')
            t.is(object.foo, 'bar', 'the correct object was added')
            t.is(object.bar, 'baz', 'the correct object was added')
            break

          case 2:
            t.is(eventName, 'update', 'event is a update event')
            t.is(object._id, 'test', 'the correct object was added')
            t.is(object.foo, 'bar', 'the correct object was added')
            t.is(object.bar, 'baz', 'the correct object was added')
            break

          default:
            t.error(new Error('unexpected number of events! Event number: ' + eventCount))
            return
        }
        eventCount += 1
      })

      await hoodie.cryptoStore.add({ foo: 'bar' })

      await store.add({
        _id: 'test',
        bar: 'baz'
      })

      await hoodie.store.add({
        _id: 'foo',
        foo: 'bar'
      })

      await store.update({
        _id: 'foo',
        bar: 'baz'
      })
      await store.update({
        _id: 'test',
        foo: 'bar'
      })
    } catch (err) {
      t.error(err)
    } finally {
      t.end()
    }
  }
)

test('cryptoStore.withPassword("test") should pass _ option on', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    const { store } = await hoodie.cryptoStore.withPassword('test')
    await store.add({
      value: 42,
      _other: 'public'
    })

    t.fail(new Error('should have thrown with doc_validation'))
  } catch (err) {
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }
})

test('cryptoStore.withPassword("test/") should work with pouchdb-hoodie-api', async t => {
  t.plan(3)

  const { db, cryptoStore } = createPouchCryptoStore()

  try {
    await cryptoStore.setup('other')
    await cryptoStore.unlock('other')

    const api = await cryptoStore.withPassword('test')
    const addEvent = new Promise((resolve, reject) => {
      api.store.on('add', (object) => {
        try {
          t.is(object._id, 'b')
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })

    const obj = await api.store.add({ _id: 'b', test: 'value' })
    t.is(obj._id, 'b', 'has correct id')

    const encrypted = await db.get(obj._id)
    t.is(encrypted.test, undefined, 'was encrypted')

    await addEvent
    t.end()
  } catch (err) {
    t.end(err)
  }
})
