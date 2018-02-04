'use strict'

var test = require('tape')
var Store = require('@hoodie/store-client')

var cryptoStore = require('../../')

var PouchDB = require('../utils/pouchdb.js')
var uniqueName = require('../utils/unique-name')

test('adds object to Store', function (t) {
  t.plan(9)

  var name = uniqueName()
  var store = new Store(name, {
    PouchDB: PouchDB,
    remote: 'remote-' + name
  })
  var hoodie = {
    store: store
  }
  cryptoStore(hoodie)

  hoodie.cryptoStore.setPassword('test')

  .then(function (salt) {
    t.is(salt.length, 32, 'setPassword resolves with salt')

    return hoodie.cryptoStore.add({
      foo: 'bar'
    })
  })

  .then(function (object) {
    t.is(object.foo, 'bar', 'resolves with value')
    t.ok(object._id, 'gets a default _id')
    t.ok(object._rev, 'gets a _rev')
    t.ok(object.hoodie, 'resolves with the hoodie object')

    return store.find(object._id)
  })

  .then(function (res) {
    t.is(res.foo, undefined, 'stored doc has no foo')
    t.ok(res.data, 'has encrypted data')
    t.ok(res.tag, 'has tag')
    t.ok(res.nonce, 'has nonce')
  })
})

test('fails for invalid object', function (t) {
  t.plan(2)

  var name = uniqueName()
  var store = new Store(name, {
    PouchDB: PouchDB,
    remote: 'remote-' + name
  })
  var hoodie = {
    store: store
  }
  cryptoStore(hoodie)

  hoodie.cryptoStore.setPassword('test')

  .then(function () {
    return hoodie.cryptoStore.add()
  })

  .catch(function (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 400, 'rejects with error 400')
  })
})

test('fails for existing object', function (t) {
  t.plan(2)

  var name = uniqueName()
  var store = new Store(name, {
    PouchDB: PouchDB,
    remote: 'remote-' + name
  })
  var hoodie = {
    store: store
  }
  cryptoStore(hoodie)

  hoodie.cryptoStore.setPassword('test')

  .then(function () {
    return hoodie.cryptoStore.add({
      _id: 'foo',
      bar: 1
    })
  })

  .then(function () {
    return hoodie.cryptoStore.add({
      _id: 'foo',
      bar: 2
    })
  })

  .catch(function (err) {
    t.ok(err instanceof Error, 'rejects with an error')
    t.is(err.status, 409, 'rejects with error 409')
  })
})

test('adds multiple objects to db', function (t) {
  t.plan(19)

  var name = uniqueName()
  var store = new Store(name, {
    PouchDB: PouchDB,
    remote: 'remote-' + name
  })
  var hoodie = {
    store: store
  }
  cryptoStore(hoodie)

  hoodie.cryptoStore.setPassword('test')

  .then(function () {
    return hoodie.cryptoStore.add({
      _id: 'foo',
      bar: 1
    })
  })

  .then(function () {
    return hoodie.cryptoStore.add([{
      foo: 'bar'
    }, {
      foo: 'baz'
    }, {
      _id: 'foo',
      foo: 'baz'
    }])
  })

  .then(function (objects) {
    t.is(objects[0].foo, 'bar', 'resolves first value')
    t.ok(objects[0]._id, 'resolves first id')
    t.ok(objects[0]._rev, 'resolves first _rev')

    t.is(objects[1].foo, 'baz', 'resolves second value')
    t.ok(objects[1]._id, 'resolves second id')
    t.ok(objects[1]._rev, 'resolves second _rev')

    t.ok(objects[2] instanceof Error, 'resolves third with error')

    return store.find([
      objects[0],
      objects[1],
      {_id: 'foo'}
    ])
  })

  .then(function (res) {
    t.is(res[0].foo, undefined, 'first stored doc has no foo')
    t.ok(res[0].data, 'first has encrypted data')
    t.ok(res[0].tag, 'first has tag')
    t.ok(res[0].nonce, 'first has nonce')

    t.is(res[1].foo, undefined, 'second stored doc has no foo')
    t.ok(res[1].data, 'second has encrypted data')
    t.ok(res[1].tag, 'second has tag')
    t.ok(res[1].nonce, 'second has nonce')

    t.is(res[2].foo, undefined, 'third stored doc has no foo')
    t.ok(res[2].data, 'third has encrypted data')
    t.ok(res[2].tag, 'third has tag')
    t.ok(res[2].nonce, 'third has nonce')
  })
})
