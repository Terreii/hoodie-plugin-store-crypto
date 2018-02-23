'use strict'

var test = require('tape')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.findAll()', function (t) {
  t.plan(7)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

  .then(hoodie.cryptoStore.findAll)

  .then(function (objects) {
    t.same(objects, [], 'resolves empty array')

    return hoodie.cryptoStore.add([{
      _id: 'a',
      foo: 'bar'
    }, {
      _id: 'b',
      foo: 'baz'
    }])
  })

  .then(hoodie.cryptoStore.findAll)

  .then(function (objects) {
    t.is(objects.length, 2, 'resolves all')
    t.is(objects[0].foo, 'bar', 'decrypt value')
    t.is(objects[1].foo, 'baz', 'decrypt value')

    return hoodie.store.add({
      _id: 'c',
      foo: 'foo'
    })
  })

  .then(hoodie.cryptoStore.findAll)

  .then(function (objects) {
    t.is(objects.length, 3, 'resolves all')
    t.is(objects[2].foo, 'foo', 'resolves unencrypted objects')

    return hoodie.store.remove(objects[0])
  })

  .then(hoodie.cryptoStore.findAll)

  .then(function (objects) {
    t.is(objects.length, 2, 'resolves all')
  })
})

test('cryptoStore.findAll(filterFunction)', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

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
    return hoodie.cryptoStore.findAll(function (object) {
      return typeof object.foo === 'number'
    })
  })

  .then(function (objects) {
    t.is(objects.length, 4, 'resolves filtered')
  })
})

test('cryptoStore.findAll() doesnt return _design docs', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

  .then(function () {
    return hoodie.cryptoStore.add([{foo: 'bar'}, {_id: '_design/bar'}])
  })

  .then(hoodie.cryptoStore.findAll)

  .then(function (objects) {
    t.is(objects.length, 1, 'resolves everything but _design/bar')
    t.isNot(objects[0]._id, '_design/bar', 'resolved doc isn\'t _design/bar')
  })
})
