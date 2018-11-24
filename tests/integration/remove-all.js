'use strict'

/*
 * Testing the cryptoStore.removeAll method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var test = require('tape')
var Promise = require('lie')

var createCryptoStore = require('../utils/createCryptoStore')
var checkTime = require('../utils/checkTime')

test('cryptoStore.removeAll()', function (t) {
  t.plan(6)

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
      return hoodie.cryptoStore.removeAll()
    })

    .then(function (objects) {
      t.is(objects.length, 3, 'resolves all')
      t.is(objects[0].foo, 'bar', 'resolves with properties')

      objects.forEach(function (object) {
        t.is(parseInt(object._rev, 10), 2, 'new revision')
      })
    })

    .then(function () {
      return hoodie.store.findAll()
    })

    .then(function (objects) {
      t.is(objects.length, 0, 'no objects can be found in store')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.removeAll(filterFunction)', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{
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
    })

    .then(function () {
      return hoodie.cryptoStore.removeAll(function (object) {
        return typeof object.foo === 'number'
      })
    })

    .then(function (objects) {
      t.is(objects.length, 4, 'removes 4 objects')
    })

    .then(function () {
      return hoodie.store.findAll()
    })

    .then(function (objects) {
      t.is(objects.length, 3, 'does not remove other 3 objects')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test("cryptoStore.removeAll() doesn't remove _design docs", function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{ foo: 'bar' }, { _id: '_design/bar' }])
    })

    .then(function () {
      return hoodie.cryptoStore.removeAll()
    })

    .then(function (objects) {
      t.is(objects.length, 1, 'resolves everything but _design/bar')
      t.isNot(objects[0]._id, '_design/bar', 'resolved doc isn\'t _design/bar')
    })

    .then(function () {
      return hoodie.store.db.get('_design/bar')
    })

    .then(function (doc) {
      t.is(doc._id, '_design/bar', 'check _design/bar still exists')
      t.isNot(doc._deleted, true, '_design/bar is not deleted')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.removeAll([objects]) creates deletedAt timestamps', function (t) {
  t.plan(10)

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
      return hoodie.cryptoStore.removeAll()
    })

    .then(function (objects) {
      objects.forEach(function (object) {
        t.ok(object._id, 'resolves doc')
        t.ok(object.hoodie.createdAt, 'should have createdAt timestamp')
        t.ok(object.hoodie.updatedAt, 'should have updatedAt timestamp')
        t.ok(object.hoodie.deletedAt, 'should have deleteAt timestamp')
        t.ok(
          checkTime(startTime, object.hoodie.deletedAt),
          'deletedAt should be the same time as right now'
        )
      })
    })

    .catch(function (err) {
      t.end(err)
    })
})
