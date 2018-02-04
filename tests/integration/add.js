'use strict'

var test = require('tape')
var Store = require('@hoodie/store-client')

var cryptoStore = require('../../')

var PouchDB = require('../utils/pouchdb.js')
var uniqueName = require('../utils/unique-name')

test('adds object to Store', function (t) {
  t.plan(8)

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
