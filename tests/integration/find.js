'use strict'

/*
 * Testing the cryptoStore.find method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')
const createPouchCryptoStore = require('../utils/createPouchCryptoStore')

test('cryptoStore.find(id)', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')
    await hoodie.cryptoStore.add({
      _id: 'foo',
      foo: 'bar'
    })

    const doc = await hoodie.cryptoStore.find('foo')
    t.is(doc._id, 'foo', 'resolves _id')
    t.is(doc.foo, 'bar', 'resolves value')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.find(object)', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')
    await hoodie.cryptoStore.add({
      _id: 'foo',
      bar: 'baz'
    })

    const doc = await hoodie.cryptoStore.find({ _id: 'foo' })
    t.is(doc._id, 'foo', 'resolves _id')
    t.is(doc.bar, 'baz', 'resolves value')
  } catch (err) {
    t.end(err)
  }
})

test('find unencrypted objects', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.store.add([
      {
        _id: 'foo',
        bar: 'baz'
      },
      {
        _id: 'bar',
        foo: 'baz'
      }
    ])

    const first = await hoodie.cryptoStore.find('foo')
    t.is(first._id, 'foo', 'resolves id')
    t.is(first.bar, 'baz', 'resolves value')

    const second = await hoodie.cryptoStore.find({ _id: 'bar' })
    t.is(second._id, 'bar', 'resolves id')
    t.is(second.foo, 'baz', 'resolves value')
  } catch (err) {
    t.end(err)
  }
})

test('find rejects with hoodie.find error for non-existing', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  await hoodie.cryptoStore.setup('test')
  await hoodie.cryptoStore.unlock('test')

  await hoodie.cryptoStore.add({ _id: 'unrelated' })

  try {
    await hoodie.cryptoStore.find('foo')
    t.fail('should have thrown')
  } catch (err) {
    t.ok(err instanceof Error, 'rejects error')
    t.is(err.status, 404)
  }

  try {
    await hoodie.cryptoStore.find({ _id: 'foo' })
    t.fail('should have thrown')
  } catch (err) {
    t.ok(err instanceof Error, 'rejects error')
    t.is(err.status, 404)
  }

  t.end()
})

test('cryptoStore.find(array)', async t => {
  t.plan(6)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      {
        _id: 'foo',
        bar: 'baz'
      },
      {
        _id: 'bar',
        foo: 'baz'
      }
    ])
    await hoodie.store.add({
      _id: 'baz',
      baz: 'foo'
    })

    const objects = await hoodie.cryptoStore.find(['foo', { _id: 'bar' }, 'baz'])
    t.is(objects[0]._id, 'foo', 'resolves id')
    t.is(objects[0].bar, 'baz', 'resolves value')
    t.is(objects[1]._id, 'bar', 'resolves id')
    t.is(objects[1].foo, 'baz', 'resolves value')
    t.is(objects[2]._id, 'baz', 'resolves id')
    t.is(objects[2].baz, 'foo', 'resolves value')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.find(array) with non-existing', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'exists',
      value: 2
    })

    const objects = await hoodie.cryptoStore.find(['exists', 'unknown'])
    t.is(objects[0]._id, 'exists', 'resolves with id for existing')
    t.is(objects[0].value, 2, 'resolves with value for existing')
    t.is(objects[1].status, 404, 'resolves with 404 error for unknown')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.find() should merge not encrypt fields into the result object', async t => {
  t.plan(6)

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

    await hoodie.store.update(obj._id, { other: 'something public' })
    const updated = await hoodie.cryptoStore.find(obj._id)

    t.is(updated.value, 42, 'encrypted value was decrypted')
    t.is(updated.notEncrypted, 'other', 'not encrypted field listed in cy_ignore')
    t.is(updated.notEncryptedTemp, true, 'not encrypted field listed in __cy_ignore')
    t.deepEqual(updated.cy_ignore, ['notEncrypted'], 'cy_ignore was saved')
    t.is(updated.__cy_ignore, undefined, '__cy_ignore was not saved')
    t.is(updated.other, 'something public', 'later added not encrypted value was merged in')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.find() should throw if plugin isn\'t unlocked', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.find('anId')
    t.fail('It should have thrown')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  try {
    await hoodie.cryptoStore.setup('test')

    await hoodie.cryptoStore.find('anId')
    t.fail('It should have thrown after setup')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  t.end()
})

test('cryptoStore.find() should work with pouchdb-hoodie-api', async t => {
  t.plan(1)

  const { cryptoStore } = createPouchCryptoStore()

  try {
    await cryptoStore.setup('test')
    await cryptoStore.unlock('test')

    const obj = await cryptoStore.add({ value: 'test' })
    const found = await cryptoStore.find(obj._id)

    t.deepEqual(obj, found, 'both decrypted objects match')
  } catch (err) {
    t.end(err)
  }
})

// todo: check for timestamps
