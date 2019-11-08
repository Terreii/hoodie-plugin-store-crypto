'use strict'

/*
 * Testing the cryptoStore.updateAll method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')
const checkTime = require('../utils/checkTime')

test('cryptoStore.updateAll(changedProperties)', async t => {
  t.plan(25)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.store.add({ _id: 'notEncrypted', foo: 'bar' })
    await hoodie.cryptoStore.add([
      { _id: 'encrypted', foo: 'bar' },
      { foo: 'bar', bar: 'foo' }
    ])

    const results = await hoodie.cryptoStore.updateAll({
      bar: 'bar',
      hoodie: { ignore: 'me' }
    })

    t.is(results.length, 3, 'resolves all')
    t.ok(results[0]._id, 'resolves with id')
    t.is(results[0].bar, 'bar', 'resolves with properties')
    t.is(results[0].hoodie.ignore, undefined, 'ignores hoodie property')

    results.forEach(result => t.ok(/^2-/.test(result._rev), 'new revision'))

    const updated = await hoodie.cryptoStore.findAll()
    updated.forEach(object => {
      t.ok(object.foo, 'old value remains')
      t.is(object.bar, 'bar', 'updated object')
    })

    const encrypted = await hoodie.store.findAll()
    encrypted
      .filter(object => !object._id.startsWith('hoodiePluginCryptoStore/'))
      .forEach(object => {
        // object is encrypted
        t.is(object.foo, undefined, 'stored doc has no foo')
        t.ok(object.data, 'has encrypted data')
        t.ok(object.tag, 'has tag')
        t.ok(object.nonce, 'has nonce')
      })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.updateAll(updateFunction)', async t => {
  t.plan(22)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.store.add({ _id: 'notEncrypted', foo: 'bar' })
    await hoodie.cryptoStore.add([
      { _id: 'encrypted', foo: 'bar' },
      { foo: 'bar', bar: 'foo' }
    ])

    const results = await hoodie.cryptoStore.updateAll(function (object) {
      object.bar = 'bar'
      return object
    })
    t.is(results.length, 3, 'resolves all')
    results.forEach(result => t.ok(/^2-/.test(result._rev), 'new revision'))

    const objects = await hoodie.cryptoStore.findAll()
    objects.forEach(object => {
      t.ok(object.foo, 'old value remains')
      t.is(object.bar, 'bar', 'updated object')
    })

    const encrypted = await hoodie.store.findAll()
    encrypted
      .filter(object => !object._id.startsWith('hoodiePluginCryptoStore/'))
      .forEach(object => {
        // object is encrypted
        t.is(object.foo, undefined, 'stored doc has no foo')
        t.ok(object.data, 'has encrypted data')
        t.ok(object.tag, 'has tag')
        t.ok(object.nonce, 'has nonce')
      })
  } catch (err) {
    t.end(err)
  }
})

test('fails cryptoStore.updateAll()', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.updateAll()
    t.fail("updateAll didn't fail")
  } catch (error) {
    t.ok(error instanceof Error, 'rejects error')
  }
})

test('cryptoStore.updateAll(change) no objects', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const results = await hoodie.cryptoStore.updateAll({})
    t.same(results, [], 'resolves empty array')
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.updateAll() doesn't update design docs", async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.store.add([
      { bar: 'foo' },
      { _id: '_design/bar', bar: 'foo' }
    ])

    const results = await hoodie.cryptoStore.updateAll({
      bar: 'bar'
    })
    t.is(results.length, 1, 'resolves everything but _design/bar')
    t.isNot(results[0]._id, '_design/bar', 'resolves with id')

    const doc = await hoodie.store.db.get('_design/bar')
    t.isNot(doc.bar, 'bar', 'check _design/bar for mutation')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.updateAll([objects]) updates all updatedAt timestamps', async t => {
  t.plan(8)

  const hoodie = createCryptoStore()

  let startTime = null

  hoodie.store.on('update', object => {
    t.ok(object._id, 'resolves doc')
    t.is(typeof object.hoodie.deletedAt, 'undefined', "deletedAt shouldn't be set")
    t.ok(
      checkTime(startTime, object.hoodie.updatedAt),
      'updatedAt should be the same time as right now'
    )
    t.not(object.hoodie.createdAt, object.hoodie.updatedAt, 'createdAt and updatedAt should not be the same')
  })

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

    startTime = new Date()
    await hoodie.cryptoStore.updateAll({ bar: 'foo' })
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.updateAll() shouldn't encrypt fields in cy_ignore and __cy_ignore", async t => {
  t.plan(10)

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
        notEncrypted: 'other',
        notEncryptedTemp: true,
        cy_ignore: ['notEncrypted'],
        __cy_ignore: ['notEncryptedTemp']
      }
    ])

    const objects = await hoodie.cryptoStore.updateAll({
      other: 'newValue',
      __cy_ignore: ['value']
    })
    objects.forEach(obj => {
      t.is(obj.other, 'newValue', 'new field was added')
    })

    const encrypted = await hoodie.store.findAll()
    t.is(
      encrypted[0].notEncrypted,
      'other',
      'field listed in cy_ignore is not encrypted after an update'
    )
    t.is(encrypted[0].value, 42, 'field listed in __cy_ignore was decrypted and saved')

    t.is(encrypted[1].notEncrypted, undefined, 'not encrypted value was encrypted and deleted')
    t.is(encrypted[1].value, 42, 'field listed in __cy_ignore was decrypted and saved')

    t.is(
      encrypted[2].notEncrypted,
      'other',
      'field listed in cy_ignore is not encrypted after an update'
    )
    t.is(encrypted[2].notEncryptedTemp, undefined, 'not encrypted value was encrypted and deleted')
    t.is(encrypted[2].value, undefined, 'not existing field listed in __cy_ignore is not an error')
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.updateAll() shouldn't encrypt fields starting with _", async t => {
  t.plan(6)

  const hoodie = createCryptoStore()
  const hoodie2 = createCryptoStore({ notHandleSpecialDocumentMembers: true })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      {
        _id: 'a',
        value: 42
      },
      {
        _id: 'b',
        other: 'not public'
      }
    ])

    const objects = await hoodie.cryptoStore.updateAll({
      _other: 'test value'
    })

    t.ok(objects instanceof Error, 'Update should have failed')
    t.fail('Update should have failed')
  } catch (err) {
    t.ok(err instanceof Error, 'Update did fail')
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }

  try {
    await hoodie2.cryptoStore.setup('test')
    await hoodie2.cryptoStore.unlock('test')

    await hoodie2.cryptoStore.add([
      {
        _id: 'a',
        value: 42
      },
      {
        _id: 'b',
        other: 'not public'
      }
    ])

    await hoodie2.cryptoStore.updateAll({
      _other: 'test value'
    })

    const objects = await hoodie2.store.findAll()
    t.is(objects[0].value, undefined, 'values still get encrypted')
    t.is(objects[0]._other, undefined, 'members starting with _ are encrypted')

    t.is(objects[1].other, undefined, 'values still get encrypted')
    t.is(objects[1]._value, undefined, 'members starting with _ are encrypted')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.updateAll() should throw if plugin isn\'t unlocked', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.updateAll({ value: 'something' })
    t.fail('It should have thrown')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  try {
    await hoodie.cryptoStore.setup('test')

    await hoodie.cryptoStore.updateAll({ value: 'something' })
    t.fail('It should have thrown after setup')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  t.end()
})
