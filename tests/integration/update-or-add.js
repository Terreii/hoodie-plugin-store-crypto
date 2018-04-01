'use strict'

var test = require('tape')
var Promise = require('lie')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.updateOrAdd(id, object) updates existing', function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      var unencrypted = hoodie.store.add({_id: 'unencrypted', foo: 'bar'})
      var encrypted = hoodie.cryptoStore.add({_id: 'encrypted', foo: 'bar'})

      return Promise.all([unencrypted, encrypted])
    })

    .then(function () {
      var unencrypted = hoodie.cryptoStore.updateOrAdd('unencrypted', {foo: 'baz'})
      var encrypted = hoodie.cryptoStore.updateOrAdd('encrypted', {foo: 'baz'})

      return Promise.all([unencrypted, encrypted])
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'unencrypted', 'resolves with id')
      t.is(objects[0].foo, 'baz', 'resolves with new object')

      t.is(objects[1]._id, 'encrypted', 'resolves with id')
      t.is(objects[1].foo, 'baz', 'resolves with new object')

      return hoodie.store.find(['unencrypted', 'encrypted'])
    })

    .then(function (objects) {
      t.is(objects[0].foo, undefined, 'stored doc 0 has no foo')
      t.ok(objects[0].data, 'stored doc 0 has encrypted data')

      t.is(objects[1].foo, undefined, 'stored doc 1 has no foo')
      t.ok(objects[1].data, 'stored doc 1 has encrypted data')
    })
})

test('cryptoStore.updateOrAdd(id, object) adds new if non-existent', function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd('newid', {foo: 'baz'})
    })

    .then(function (object) {
      t.is(object._id, 'newid', 'resolves with id')
      t.is(object.foo, 'baz', 'resolves with new object')

      return hoodie.store.find('newid')
    })

    .then(function (object) {
    // object is encrypted
      t.is(object.foo, undefined, 'stored doc has no foo')
      t.ok(object.data, 'has encrypted data')
      t.ok(object.tag, 'has tag')
      t.ok(object.nonce, 'has nonce')
    })
})

test('cryptoStore.updateOrAdd(id) fails with 400 error', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd('id')
    })

    .catch(function (error) {
      t.is(error.status, 400, 'rejects with invalid request error')
    })
})

test('cryptoStore.updateOrAdd(object) updates existing', function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      var unencrypted = hoodie.store.add({_id: 'unencrypted', foo: 'bar'})
      var encrypted = hoodie.cryptoStore.add({_id: 'encrypted', foo: 'bar'})

      return Promise.all([unencrypted, encrypted])
    })

    .then(function () {
      var unencrypted = hoodie.cryptoStore.updateOrAdd({_id: 'unencrypted', foo: 'baz'})
      var encrypted = hoodie.cryptoStore.updateOrAdd({_id: 'encrypted', foo: 'baz'})

      return Promise.all([unencrypted, encrypted])
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'unencrypted', 'resolves with id')
      t.is(objects[0].foo, 'baz', 'resolves with new object')

      t.is(objects[1]._id, 'encrypted', 'resolves with id')
      t.is(objects[1].foo, 'baz', 'resolves with new object')

      return hoodie.store.find(['unencrypted', 'encrypted'])
    })

    .then(function (objects) {
      t.is(objects[0].foo, undefined, 'stored doc 0 has no foo')
      t.ok(objects[0].data, 'stored doc 0 has encrypted data')

      t.is(objects[1].foo, undefined, 'stored doc 1 has no foo')
      t.ok(objects[1].data, 'stored doc 1 has encrypted data')
    })
})

test('cryptoStore.updateOrAdd(object) adds new if non-existent', function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd({_id: 'newid', foo: 'baz'})
    })

    .then(function (object) {
      t.is(object._id, 'newid', 'resolves with id')
      t.is(object.foo, 'baz', 'resolves with new object')

      return hoodie.store.find('newid')
    })

    .then(function (object) {
    // object is encrypted
      t.is(object.foo, undefined, 'stored doc has no foo')
      t.ok(object.data, 'has encrypted data')
      t.ok(object.tag, 'has tag')
      t.ok(object.nonce, 'has nonce')
    })
})

test('cryptoStore.updateOrAdd(object) without object._id fails with 400 error', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd({foo: 'bar'})
    })

    .catch(function (error) {
      t.is(error.status, 400, 'rejects with invalid request error')
    })
})

test('cryptoStore.updateOrAdd(array) updates existing, adds new', function (t) {
  t.plan(14)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      var unencrypted = hoodie.store.add({_id: 'unencrypted', foo: 'bar'})
      var encrypted = hoodie.cryptoStore.add({_id: 'encrypted', foo: 'bar'})

      return Promise.all([unencrypted, encrypted])
    })

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd([
        {_id: 'unencrypted', foo: 'baz'},
        {_id: 'encrypted', foo: 'baz'},
        {_id: 'unknown', foo: 'baz'}
      ])
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'unencrypted', 'object1 to be updated')
      t.is(objects[0].foo, 'baz', 'object1 to be updated')
      t.is(parseInt(objects[0]._rev, 10), 2, 'object1 has revision 2')

      t.is(objects[1]._id, 'encrypted', 'object2 to be updated')
      t.is(objects[1].foo, 'baz', 'object2 to be updated')
      t.is(parseInt(objects[1]._rev, 10), 2, 'object2 has revision 2')

      t.is(objects[2]._id, 'unknown', 'object3 to be created')
      t.is(objects[2].foo, 'baz', 'object3 to be created')

      return hoodie.store.find(['unencrypted', 'encrypted', 'unknown'])
    })

    .then(function (objects) {
      t.is(objects[0].foo, undefined, 'stored doc 1 has no foo')
      t.ok(objects[0].data, 'stored doc 1 has encrypted data')

      t.is(objects[1].foo, undefined, 'stored doc 2 has no foo')
      t.ok(objects[1].data, 'stored doc 2 has encrypted data')

      t.is(objects[2].foo, undefined, 'stored doc 3 has no foo')
      t.ok(objects[2].data, 'stored doc 3 has encrypted data')
    })
})
