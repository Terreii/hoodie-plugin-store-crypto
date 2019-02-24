'use strict'

var test = require('tape')
var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.isEncrypted() exists', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  t.equal(typeof hoodie.cryptoStore.isEncrypted, 'function', 'exists')
  t.ok(
    hoodie.cryptoStore.withIdPrefix('test/').isEncrypted == null, 'withIdPrefix doesn\'t have it.'
  )
  t.ok(
    hoodie.cryptoStore.withPassword('test').isEncrypted == null, 'withPassword doesn\'t have it.'
  )
})

test('cryptoStore.isEncrypted(doc) returns true for encrypted docs', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({ value: 'encrypted' })
    })

    .then(function (doc) {
      t.equal(hoodie.cryptoStore.isEncrypted(doc), false, 'not encrypted object')

      return hoodie.store.find(doc._id)
    })

    .then(function (doc) {
      t.equal(hoodie.cryptoStore.isEncrypted(doc), true, 'encrypted object')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.isEncrypted(null|undefined|string|number) throws', function (t) {
  t.plan(5)

  var hoodie = createCryptoStore()

  t.throws(function () {
    hoodie.cryptoStore.isEncrypted(null)
  }, pouchdbErrors.NOT_AN_OBJECT.message, 'throws on null')

  t.throws(function () {
    hoodie.cryptoStore.isEncrypted(undefined)
  }, pouchdbErrors.NOT_AN_OBJECT.message, 'throws on undefined')

  t.throws(function () {
    hoodie.cryptoStore.isEncrypted('test')
  }, pouchdbErrors.NOT_AN_OBJECT.message, 'throws on string')

  t.throws(function () {
    hoodie.cryptoStore.isEncrypted(123)
  }, pouchdbErrors.NOT_AN_OBJECT.message, 'throws on number')

  t.throws(function () {
    hoodie.cryptoStore.isEncrypted(true)
  }, pouchdbErrors.NOT_AN_OBJECT.message, 'throws on boolean')
})

test('cryptoStore.isEncrypted(Promise) waits for resolving of promise', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var addPromise = hoodie.store.add({ value: 'unencrypted' })

      var result = hoodie.cryptoStore.isEncrypted(addPromise)

      t.ok(result instanceof Promise, 'returns a promise')

      return result
    })

    .then(function (isEncrypted) {
      t.equal(isEncrypted, false, 'resolves to a boolean')

      var addPromise = hoodie.cryptoStore.add({ value: 'encrypted' })

        .then(function (doc) {
          return hoodie.store.find(doc._id)
        })

      return hoodie.cryptoStore.isEncrypted(addPromise)
    })

    .then(function (isEncrypted) {
      t.equal(isEncrypted, true, 'resolves to a boolean')

      return hoodie.cryptoStore.isEncrypted(Promise.reject(new Error('test')))

        .then(
          function () {
            t.fail('should have rejected on rejecting Promise')
          },
          function (err) {
            t.equal(err.message, 'test', 'did reject if Promise did reject')
          }
        )
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.isEncrypted(Promise) rejects if promise resolves not to an object', function (t) {
  t.plan(5)

  var hoodie = createCryptoStore()

  var promieses = [
    Promise.resolve(null),
    Promise.resolve(undefined),
    Promise.resolve(123),
    Promise.resolve('test'),
    Promise.resolve(true)
  ].map(function (valuePromise) {
    return hoodie.cryptoStore.isEncrypted(valuePromise)
      .then(
        function (value) {
          t.fail("didn't reject for " + typeof value)
        },
        function (err) {
          t.equal(
            err.message, pouchdbErrors.NOT_AN_OBJECT.message, 'did reject for not object promise'
          )
        }
      )
  })

  Promise.all(promieses)
    .catch(function (err) {
      t.end(err)
    })
})
