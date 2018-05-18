'use strict'

var test = require('tape')
var Promise = require('lie')

var createCryptoStore = require('../utils/createCryptoStore')

function checkTime (objectTime) {
  var now = Date.now()
  var timeObj = new Date(objectTime)
  var isoString = timeObj.toISOString()
  var time = timeObj.getTime()
  return time <= now && time > (now - 10) && objectTime === isoString
}

test('cryptoStore.updateAll(changedProperties)', function (t) {
  t.plan(25)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      var unencrypted = hoodie.store.add({_id: 'unencrypted', foo: 'bar'})
      var encrypted = hoodie.cryptoStore.add([
        {_id: 'encrypted', foo: 'bar'},
        {foo: 'bar', bar: 'foo'}
      ])

      return Promise.all([unencrypted, encrypted])
    })

    .then(function () {
      return hoodie.cryptoStore.updateAll({
        bar: 'bar',
        hoodie: {ignore: 'me'}
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
      objects.forEach(function (object) {
      // object is encrypted
        t.is(object.foo, undefined, 'stored doc has no foo')
        t.ok(object.data, 'has encrypted data')
        t.ok(object.tag, 'has tag')
        t.ok(object.nonce, 'has nonce')
      })
    })
})

test('cryptoStore.updateAll(updateFunction)', function (t) {
  t.plan(22)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      var unencrypted = hoodie.store.add({_id: 'unencrypted', foo: 'bar'})
      var encrypted = hoodie.cryptoStore.add([
        {_id: 'encrypted', foo: 'bar'},
        {foo: 'bar', bar: 'foo'}
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
      objects.forEach(function (object) {
      // object is encrypted
        t.is(object.foo, undefined, 'stored doc has no foo')
        t.ok(object.data, 'has encrypted data')
        t.ok(object.tag, 'has tag')
        t.ok(object.nonce, 'has nonce')
      })
    })
})

test('fails cryptoStore.updateAll()', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.updateAll()
    })

    .catch(function (error) {
      t.ok(error instanceof Error, 'rejects error')
    })
})

test('cryptoStore.updateAll(change) no objects', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.updateAll({})
    })

    .then(function (results) {
      t.same(results, [], 'reolves empty array')
    })
})

test('cryptoStore.updateAll() doesnt update design docs', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.store.add([
        {bar: 'foo'},
        {_id: '_design/bar', bar: 'foo'}
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
})

test('cryptoStore.updateAll([objects]) updates all updatedAt timestamps', function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add([
        {foo: 'bar'},
        {foo: 'baz'}
      ])
    })

    .then(function () {
      return new Promise(function (resolve) {
        setTimeout(resolve, 100)
      })
    })

    .then(function () {
      return hoodie.cryptoStore.updateAll({bar: 'foo'})
    })

  hoodie.store.on('update', function (object) {
    t.ok(object._id, 'resolves doc')
    t.is(typeof object.hoodie.deletedAt, 'undefined', 'deletedAt shouldnt be set')
    t.ok(checkTime(object.hoodie.updatedAt), 'updatedAt should be the same time as right now')
    t.not(object.hoodie.createdAt, object.hoodie.updatedAt, 'createdAt and updatedAt should not be the same')
  })
})
