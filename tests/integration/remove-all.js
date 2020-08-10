'use strict'

/*
 * Testing the cryptoStore.removeAll method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')
const checkTime = require('../utils/checkTime')

test('cryptoStore.removeAll()', async t => {
  t.plan(6)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.store.add({ _id: 'notEncrypted', foo: 'bar' })
    await hoodie.cryptoStore.add([
      { _id: 'encrypted', foo: 'bar' },
      { foo: 'bar', bar: 'foo' }
    ])

    const objects = await hoodie.cryptoStore.removeAll()

    t.is(objects.length, 3, 'resolves all')
    t.is(objects[0].foo, 'bar', 'resolves with properties')

    objects.forEach(object => {
      t.is(parseInt(object._rev, 10), 2, 'new revision')
    })

    const allObjects = await hoodie.store.findAll()
    const filtered = allObjects.filter(
      object => !object._id.startsWith('hoodiePluginCryptoStore/')
    )
    t.is(filtered.length, 0, 'no objects can be found in store')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.removeAll(filterFunction)', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const cryptoStoreDocs = await hoodie.store.withIdPrefix('hoodiePluginCryptoStore/').findAll()

    await hoodie.cryptoStore.add([
      { foo: 0 },
      { foo: 'foo' },
      { foo: 2 },
      { foo: 'bar' },
      { foo: 3 },
      { foo: 'baz' },
      { foo: 4 }
    ])

    const objects = await hoodie.cryptoStore.removeAll(object => typeof object.foo === 'number')
    t.is(objects.length, 4, 'removes 4 objects')

    const allObjects = await hoodie.store.findAll()

    const filtered = allObjects.filter(
      object => !object._id.startsWith('hoodiePluginCryptoStore/')
    )
    t.is(filtered.length, 3, 'does not remove other 3 objects')

    const ids = allObjects.map(doc => doc._id)
    t.ok(
      cryptoStoreDocs.length > 0 && cryptoStoreDocs.every(doc => ids.indexOf(doc._id) !== -1),
      'does not remove "hoodiePluginCryptoStore/" docs'
    )
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.removeAll() doesn't remove _design docs or plugin's docs", async t => {
  t.plan(6)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([{ foo: 'bar' }, { _id: '_design/bar' }])

    const objects = await hoodie.cryptoStore.removeAll()
    t.is(
      objects.length,
      1,
      'resolves everything but _design/bar and hoodiePluginCryptoStore/salt'
    )
    t.isNot(objects[0]._id, '_design/bar', 'resolved doc isn\'t _design/bar')

    const ddoc = await hoodie.store.db.get('_design/bar')
    t.is(ddoc._id, '_design/bar', 'check _design/bar still exists')
    t.isNot(ddoc._deleted, true, '_design/bar is not deleted')

    const saltDoc = await hoodie.store.db.get('hoodiePluginCryptoStore/salt')
    t.is(
      saltDoc._id,
      'hoodiePluginCryptoStore/salt',
      'check hoodiePluginCryptoStore/salt still exists'
    )
    t.isNot(saltDoc._deleted, true, 'hoodiePluginCryptoStore/salt is not deleted')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.removeAll([objects]) creates deletedAt timestamps', async t => {
  t.plan(10)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { foo: 'bar' },
      { foo: 'baz' }
    ])

    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    const startTime = new Date()
    const objects = await hoodie.cryptoStore.removeAll()

    objects.forEach(object => {
      t.ok(object._id, 'resolves doc')
      t.ok(object.hoodie.createdAt, 'should have createdAt timestamp')
      t.ok(object.hoodie.updatedAt, 'should have updatedAt timestamp')
      t.ok(object.hoodie.deletedAt, 'should have deleteAt timestamp')
      t.ok(
        checkTime(startTime, object.hoodie.deletedAt),
        'deletedAt should be the same time as right now'
      )
    })
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.removeAll() shouldn't encrypt fields in cy_ignore and __cy_ignore", async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  hoodie.store.on('remove', obj => {
    switch (obj._id) {
      case 'a_with_cy_ignore':
        t.is(
          obj.notEncrypted,
          'other',
          'field listed in cy_ignore is not encrypted after an update'
        )
        break

      case 'b_with___cy_ignore':
        t.is(obj.notEncrypted, undefined, 'not encrypted value was encrypted and deleted')
        break

      case 'c_with_both':
        t.is(
          obj.notEncrypted,
          'other',
          'field listed in cy_ignore is not encrypted after an update'
        )
        t.is(obj.notEncryptedTemp, undefined, 'not encrypted value was encrypted and deleted')
        break

      default:
        t.fail('unknown id')
    }
  })

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
        notEncrypted: 'other',
        notEncryptedTemp: true,
        cy_ignore: ['notEncrypted'],
        __cy_ignore: ['notEncryptedTemp']
      }
    ])

    await hoodie.cryptoStore.removeAll()
    await new Promise(resolve => setTimeout(resolve, 10))
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.removeAll() shouldn't encrypt fields starting with _", async t => {
  t.plan(6)

  const hoodie = createCryptoStore()
  const hoodie2 = createCryptoStore({ notHandleSpecialDocumentMembers: true })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      {
        _id: 'a',
        value: 42,
        _other: 'test value'
      },
      {
        _id: 'b',
        _value: 42,
        other: 'test value'
      }
    ])

    const objects = await hoodie.cryptoStore.removeAll()
    t.ok(objects instanceof Error, 'Update should have failed')
    t.fail('Update should have failed')
  } catch (err) {
    t.ok(err instanceof Error, 'Update did fail')
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }

  hoodie2.store.on('remove', obj => {
    switch (obj._id) {
      case 'a':
        t.is(obj.value, undefined, 'values still get encrypted')
        t.is(obj._other, undefined, 'values starting with _ are encrypted')
        break

      case 'b':
        t.is(obj.other, undefined, 'values still get encrypted')
        t.is(obj._value, undefined, 'values starting with _ are encrypted')
        break

      default:
        t.fail('unknown id')
    }
  })

  try {
    await hoodie2.cryptoStore.setup('test')
    await hoodie2.cryptoStore.unlock('test')

    await hoodie2.cryptoStore.add([
      {
        _id: 'a',
        value: 42,
        _other: 'test value'
      },
      {
        _id: 'b',
        _value: 42,
        other: 'test value'
      }
    ])
    await hoodie2.cryptoStore.removeAll()
    await new Promise(resolve => setTimeout(resolve, 10))
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.removeAll() should throw if plugin isn\'t unlocked', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.removeAll()
    t.fail('It should have thrown')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  try {
    await hoodie.cryptoStore.setup('test')

    await hoodie.cryptoStore.removeAll()
    t.fail('It should have thrown after setup')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  t.end()
})
