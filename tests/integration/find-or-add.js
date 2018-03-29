'use strict'

var test = require('tape')
var Promise = require('lie')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.findOrAdd(id, object) finds existing', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({_id: 'exists', foo: 'bar'})
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd('exists', {foo: 'baz'})
    })

    .then(function (object) {
      t.is(object._id, 'exists', 'resolves with id')
      t.is(object.foo, 'bar', 'resolves with old object')

      return hoodie.store.add({_id: 'unencrypted', foo: 'bar'})
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd('unencrypted', {foo: 'baz'})
    })

    .then(function (object) {
      t.is(object._id, 'unencrypted', 'resolves with id')
      t.is(object.foo, 'bar', 'resolves with old object')
    })
})

test('cryptoStore.findOrAdd(id, object) adds new', function (t) {
  t.plan(5)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.findOrAdd('newId', {foo: 'bar'})
    })

    .then(function (object) {
      t.is(object._id, 'newId', 'resolves with id')
      t.is(object.foo, 'bar', 'resolves with new object')

      return hoodie.store.find(object._id)
    })

    .then(function (object) {
      t.is(object._id, 'newId', 'resolves with id')
      t.ok(object.data, 'has encrypted data')
      t.is(object.foo, undefined, 'stored doc has no foo')
    })
})

test('cryptoStore.findOrAdd(id) fails if no object exists', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.findOrAdd('an-id')
    })

    .catch(function (err) {
      t.is(err.status, 412, 'rejects with 412 error')
    })
})

test('cryptoStore.findOrAdd(object) finds existing', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({_id: 'encrypted', foo: 'bar'})
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd({_id: 'encrypted', foo: 'baz'})
    })

    .then(function (object) {
      t.is(object._id, 'encrypted', 'resolves with id')
      t.is(object.foo, 'bar', 'resolves with old object')

      return hoodie.store.add({_id: 'unencrypted', foo: 'bar'})
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd({_id: 'unencrypted', foo: 'baz'})
    })

    .then(function (object) {
      t.is(object._id, 'unencrypted', 'resolves with id')
      t.is(object.foo, 'bar', 'resolves with old object')
    })
})

test('cryptoStore.findOrAdd(object) adds new', function (t) {
  t.plan(5)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.findOrAdd({_id: 'newId', foo: 'bar'})
    })

    .then(function (object) {
      t.is(object._id, 'newId', 'resolves with id')
      t.is(object.foo, 'bar', 'resolves with new object')

      return hoodie.store.find(object._id)
    })

    .then(function (object) {
      t.is(object._id, 'newId', 'resolves with id')
      t.ok(object.data, 'has encrypted data')
      t.is(object.foo, undefined, 'stored doc has no foo')
    })
})

test('cryptoStore.findOrAdd(object) fails if object has no id', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.findOrAdd({foo: 'bar'})
    })

    .catch(function (err) {
      t.is(err.status, 412, 'rejects with 412 error')
    })
})

test('cryptoStore.findOrAdd([object1, object2])', function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      var encrypted = hoodie.cryptoStore.add({_id: 'encrypted', foo: 'bar'})
      var unencrypted = hoodie.store.add({_id: 'unencrypted', foo: 'bar'})

      return Promise.all([encrypted, unencrypted])
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd([
        {_id: 'encrypted', foo: 'baz'},
        {_id: 'unencrypted', foo: 'baz'},
        {_id: 'added', foo: 'baz'}
      ])
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'encrypted', 'object1 to be found')
      t.is(objects[0].foo, 'bar', 'object1 to be found')
      t.is(objects[1]._id, 'unencrypted', 'object2 to be found')
      t.is(objects[1].foo, 'bar', 'object2 to be found')
      t.is(objects[2]._id, 'added', 'object3 to be found')
      t.is(objects[2].foo, 'baz', 'object3 to be found')

      return hoodie.store.find('added')
    })

    .then(function (object) {
      t.ok(object.data, 'has encrypted data')
      t.is(object.foo, undefined, 'stored doc has no foo')
    })
})
