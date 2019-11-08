'use strict'

/*
 * Testing the cryptoStore.findAll method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.findAll()', async t => {
  t.plan(7)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const objects = await hoodie.cryptoStore.findAll()
    t.same(objects, [], 'resolves empty array')

    await hoodie.cryptoStore.add([
      {
        _id: 'a',
        foo: 'bar'
      },
      {
        _id: 'b',
        foo: 'baz'
      }
    ])

    const moarObjects = await hoodie.cryptoStore.findAll()
    t.is(moarObjects.length, 2, 'resolves all')
    t.is(moarObjects[0].foo, 'bar', 'decrypt value')
    t.is(moarObjects[1].foo, 'baz', 'decrypt value')

    await hoodie.store.add({
      _id: 'c',
      foo: 'foo'
    })
    const nextObjects = await hoodie.cryptoStore.findAll()
    t.is(nextObjects.length, 3, 'resolves all')
    t.is(nextObjects[2].foo, 'foo', 'resolves not encrypted objects')

    await hoodie.store.remove(nextObjects[0])
    const objectsAfterDelete = await hoodie.cryptoStore.findAll()
    t.is(objectsAfterDelete.length, 2, 'resolves all')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.findAll(filterFunction)', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([{
      foo: 0
    }, {
      foo: 'foo'
    }, {
      foo: 2
    }, {
      foo: 'bar'
    }, {
      foo: 3
    }, {
      foo: 'baz'
    }, {
      foo: 4
    }])

    const objects = await hoodie.cryptoStore.findAll(object => typeof object.foo === 'number')
    t.is(objects.length, 4, 'resolves filtered')
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.findAll() doesn't return _design docs", async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([{ foo: 'bar' }, { _id: '_design/bar' }])

    const objects = await hoodie.cryptoStore.findAll()
    t.is(objects.length, 1, 'resolves everything but _design/bar')
    t.isNot(objects[0]._id, '_design/bar', 'resolved doc isn\'t _design/bar')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.findAll() should merge not encrypt fields into the result object', async t => {
  t.plan(8)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      {
        _id: 'a_with_cy_ignore',
        value: 42,
        notEncrypted: 'other',
        cy_ignore: ['notEncrypted']
      },
      {
        _id: 'b_with___cy_ignore',
        value: 42,
        notEncrypted: true,
        __cy_ignore: ['notEncrypted']
      },
      {
        _id: 'c_with_both',
        value: 42,
        notEncrypted: 'other',
        notEncryptedTemp: true,
        cy_ignore: ['notEncrypted'],
        __cy_ignore: ['notEncryptedTemp']
      }
    ])

    const objects = await hoodie.cryptoStore.findAll()

    t.is(objects[0].notEncrypted, 'other', 'not encrypted value is merged in')
    t.deepEqual(objects[0].cy_ignore, ['notEncrypted'], 'cy_ignore is saved')

    t.is(objects[1].notEncrypted, true, 'temp not encrypted value is merged in')
    t.is(objects[1].__cy_ignore, undefined, '__cy_ignore is not saved')

    t.is(objects[2].notEncrypted, 'other', 'not encrypted value is merged in')
    t.is(objects[2].notEncryptedTemp, true, 'temp not encrypted value is merged in')
    t.deepEqual(objects[2].cy_ignore, ['notEncrypted'], 'cy_ignore is saved')
    t.is(objects[2].__cy_ignore, undefined, '__cy_ignore is not saved')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.findAll() should throw if plugin isn\'t unlocked', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.findAll()

    t.fail('It should have thrown')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.findAll()

    t.fail('It should have thrown after setup')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  t.end()
})
