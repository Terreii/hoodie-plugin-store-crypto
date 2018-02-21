'use strict'

var test = require('tape')
var Store = require('@hoodie/store-client')

var cryptoStore = require('../../')

var PouchDB = require('../utils/pouchdb.js')
var uniqueName = require('../utils/unique-name')

test('cryptoStore.find(id)', function (t) {
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
      foo: 'bar'
    })
  })

  .then(function () {
    return hoodie.cryptoStore.find('foo')
  })

  .then(function (doc) {
    t.is(doc._id, 'foo', 'resolves _id')
    t.is(doc.foo, 'bar', 'resolves value')
  })
})

test('cryptoStore.find(object)', function (t) {
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
      bar: 'baz'
    })
  })

  .then(function () {
    return hoodie.cryptoStore.find({_id: 'foo'})
  })

  .then(function (doc) {
    t.is(doc._id, 'foo', 'resolves _id')
    t.is(doc.bar, 'baz', 'resolves value')
  })
})

test('find unencrypted objects', function (t) {
  t.plan(4)

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
    return hoodie.store.add([{
      _id: 'foo',
      bar: 'baz'
    }, {
      _id: 'bar',
      foo: 'baz'
    }])
  })

  .then(function () {
    hoodie.cryptoStore.find('foo')

    .then(function (object) {
      t.is(object._id, 'foo', 'resolves id')
      t.is(object.bar, 'baz', 'resolves value')
    })

    hoodie.cryptoStore.find({_id: 'bar'})

    .then(function (object) {
      t.is(object._id, 'bar', 'resolves id')
      t.is(object.foo, 'baz', 'resolves value')
    })
  })
})

test('find rejects with hoodie.find error for non-existing', function (t) {
  t.plan(4)

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
      _id: 'unrelated'
    })
  })

  .then(function () {
    hoodie.cryptoStore.find('foo')

    .catch(function (err) {
      t.ok(err instanceof Error, 'rejects error')
      t.is(err.status, 404)
    })

    hoodie.cryptoStore.find({_id: 'foo'})

    .catch(function (err) {
      t.ok(err instanceof Error, 'rejects error')
      t.is(err.status, 404)
    })
  })
})

test('cryptoStore.find(array)', function (t) {
  t.plan(6)

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
    return hoodie.cryptoStore.add([{
      _id: 'foo',
      bar: 'baz'
    }, {
      _id: 'bar',
      foo: 'baz'
    }])
  })

  .then(function () {
    return hoodie.store.add({
      _id: 'baz',
      baz: 'foo'
    })
  })

  .then(function () {
    return hoodie.cryptoStore.find(['foo', {_id: 'bar'}, 'baz'])
  })

  .then(function (objects) {
    t.is(objects[0]._id, 'foo', 'resolves id')
    t.is(objects[0].bar, 'baz', 'resolves value')
    t.is(objects[1]._id, 'bar', 'resolves id')
    t.is(objects[1].foo, 'baz', 'resolves value')
    t.is(objects[2]._id, 'baz', 'resolves id')
    t.is(objects[2].baz, 'foo', 'resolves value')
  })
})

test('cryptoStore.find(array) with non-existing', function (t) {
  t.plan(3)

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
      _id: 'exists',
      value: 2
    })
  })

  .then(function () {
    return hoodie.cryptoStore.find(['exists', 'unknown'])
  })

  .then(function (objects) {
    t.is(objects[0]._id, 'exists', 'resolves with id for existing')
    t.is(objects[0].value, 2, 'resolves with value for existing')
    t.is(objects[1].status, 404, 'resolves with 404 error for unknown')
  })
})

// todo: check for timestamps
