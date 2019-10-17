'use strict'

/*
 * Testing the cryptoStore.updateAll method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var test = require('tape')
var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')
var checkTime = require('../utils/checkTime')

test('cryptoStore.updateAll(changedProperties)', function (t) {
  t.plan(25)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var unencrypted = hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })
      var encrypted = hoodie.cryptoStore.add([
        { _id: 'encrypted', foo: 'bar' },
        { foo: 'bar', bar: 'foo' }
      ])

      return Promise.all([unencrypted, encrypted])
    })

    .then(function () {
      return hoodie.cryptoStore.updateAll({
        bar: 'bar',
        hoodie: { ignore: 'me' }
      })
    })

    .then(function (results) {
      t.is(results.length, 3, 'resolves all')
      t.ok(results[0]._id, 'resolves with id')
      t.is(results[0].bar, 'bar', 'resolves with properties')
      t.is(results[0].hoodie.ignore, undefined, 'ignores hoodie property')

      results.forEach(function (result) {
        t.ok(/^2-/.test(result._rev), 'new revision')
      })
    })

    .then(hoodie.cryptoStore.findAll)

    .then(function (objects) {
      objects.forEach(function (object) {
        t.ok(object.foo, 'old value remains')
        t.is(object.bar, 'bar', 'updated object')
      })
    })

    .then(hoodie.store.findAll)

    .then(function (objects) {
      objects
        .filter(function (object) {
          return /^hoodiePluginCryptoStore\//.test(object._id) !== true
        })
        .forEach(function (object) {
          // object is encrypted
          t.is(object.foo, undefined, 'stored doc has no foo')
          t.ok(object.data, 'has encrypted data')
          t.ok(object.tag, 'has tag')
          t.ok(object.nonce, 'has nonce')
        })
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.updateAll(updateFunction)', function (t) {
  t.plan(22)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var unencrypted = hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })
      var encrypted = hoodie.cryptoStore.add([
        { _id: 'encrypted', foo: 'bar' },
        { foo: 'bar', bar: 'foo' }
      ])

      return Promise.all([unencrypted, encrypted])
    })

    .then(function () {
      return hoodie.cryptoStore.updateAll(function (object) {
        object.bar = 'bar'
        return object
      })
    })

    .then(function (results) {
      t.is(results.length, 3, 'resolves all')

      results.forEach(function (result) {
        t.ok(/^2-/.test(result._rev), 'new revision')
      })
    })

    .then(hoodie.cryptoStore.findAll)

    .then(function (objects) {
      objects.forEach(function (object) {
        t.ok(object.foo, 'old value remains')
        t.is(object.bar, 'bar', 'updated object')
      })
    })

    .then(hoodie.store.findAll)

    .then(function (objects) {
      objects
        .filter(function (object) {
          return /^hoodiePluginCryptoStore\//.test(object._id) !== true
        })
        .forEach(function (object) {
          // object is encrypted
          t.is(object.foo, undefined, 'stored doc has no foo')
          t.ok(object.data, 'has encrypted data')
          t.ok(object.tag, 'has tag')
          t.ok(object.nonce, 'has nonce')
        })
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('fails cryptoStore.updateAll()', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.updateAll()
    })

    .then(function () {
      t.fail("updateAll didn't fail")
    })

    .catch(function (error) {
      t.ok(error instanceof Error, 'rejects error')
    })
})

test('cryptoStore.updateAll(change) no objects', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.updateAll({})
    })

    .then(function (results) {
      t.same(results, [], 'reolves empty array')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.updateAll() doesnt update design docs', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.store.add([
        { bar: 'foo' },
        { _id: '_design/bar', bar: 'foo' }
      ])
    })

    .then(function () {
      return hoodie.cryptoStore.updateAll({
        bar: 'bar'
      })
    })

    .then(function (results) {
      t.is(results.length, 1, 'resolves everything but _design/bar')
      t.isNot(results[0]._id, '_design/bar', 'resolves with id')
    })

    .then(function () {
      return hoodie.store.db.get('_design/bar')
    })

    .then(function (doc) {
      t.isNot(doc.bar, 'bar', 'check _design/bar for mutation')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.updateAll([objects]) updates all updatedAt timestamps', function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  var startTime = null

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([
        { foo: 'bar' },
        { foo: 'baz' }
      ])
    })

    .then(function () {
      return new Promise(function (resolve) {
        setTimeout(resolve, 100)
      })
    })

    .then(function () {
      startTime = new Date()
      return hoodie.cryptoStore.updateAll({ bar: 'foo' })
    })

    .catch(function (err) {
      t.end(err)
    })

  hoodie.store.on('update', function (object) {
    t.ok(object._id, 'resolves doc')
    t.is(typeof object.hoodie.deletedAt, 'undefined', 'deletedAt shouldnt be set')
    t.ok(
      checkTime(startTime, object.hoodie.updatedAt),
      'updatedAt should be the same time as right now'
    )
    t.not(object.hoodie.createdAt, object.hoodie.updatedAt, 'createdAt and updatedAt should not be the same')
  })
})

test("cryptoStore.updateAll() shouldn't encrypt fields in cy_ignore and __cy_ignore", function (t) {
  t.plan(10)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([
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
    })

    .then(function () {
      return hoodie.cryptoStore.updateAll({
        other: 'newValue',
        __cy_ignore: ['value']
      })
    })

    .then(function (objects) {
      objects.forEach(function (obj) {
        t.is(obj.other, 'newValue', 'new field was added')
      })

      return hoodie.store.findAll()
    })

    .then(function (objects) {
      t.is(
        objects[0].notEncrypted,
        'other',
        'field listed in cy_ignore is not encrypted after an update'
      )
      t.is(objects[0].value, 42, 'field listed in __cy_ignore was decrypted and saved')

      t.is(objects[1].notEncrypted, undefined, 'not encrypted value was encrypted and deleted')
      t.is(objects[1].value, 42, 'field listed in __cy_ignore was decrypted and saved')

      t.is(
        objects[2].notEncrypted,
        'other',
        'field listed in cy_ignore is not encrypted after an update'
      )
      t.is(objects[2].notEncryptedTemp, undefined, 'not encrypted value was encrypted and deleted')
      t.is(objects[2].value, undefined, 'not existing field listed in __cy_ignore is not an error')
    })

    .catch(t.end)
})

test('cryptoStore.updateAll() should throw if plugin isn\'t unlocked', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.updateAll({ value: 'something' })

    .then(function () {
      t.fail('It should have thrown')
    })

    .catch(function (err) {
      t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
      t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
    })

    .then(function () {
      return hoodie.cryptoStore.setup('test')
    })

    .then(function () {
      return hoodie.cryptoStore.updateAll({ value: 'something' })
    })

    .then(function () {
      t.fail('It should have thrown after setup')
    })

    .catch(function (err) {
      t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
      t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
    })

    .then(function () {
      t.end()
    })
})
