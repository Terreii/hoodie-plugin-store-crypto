'use strict'

/*
 * Testing the cryptoStore.findAll method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var test = require('tape')
var pouchdbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.findAll()', function (t) {
  t.plan(7)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

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

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.findAll(filterFunction)', function (t) {
  t.plan(1)

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
      return hoodie.cryptoStore.findAll(function (object) {
        return typeof object.foo === 'number'
      })
    })

    .then(function (objects) {
      t.is(objects.length, 4, 'resolves filtered')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.findAll() doesnt return _design docs', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{ foo: 'bar' }, { _id: '_design/bar' }])
    })

    .then(hoodie.cryptoStore.findAll)

    .then(function (objects) {
      t.is(objects.length, 1, 'resolves everything but _design/bar')
      t.isNot(objects[0]._id, '_design/bar', 'resolved doc isn\'t _design/bar')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.findAll() should merge not encrypt fields into the result object', function (t) {
  t.plan(8)

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
          value: 42,
          notEncrypted: 'other',
          notEncryptedTemp: true,
          cy_ignore: ['notEncrypted'],
          __cy_ignore: ['notEncryptedTemp']
        }
      ])
    })

    .then(function () {
      return hoodie.cryptoStore.findAll()
    })

    .then(function (objects) {
      t.is(objects[0].notEncrypted, 'other', 'not encrypted value is merged in')
      t.deepEqual(objects[0].cy_ignore, ['notEncrypted'], 'cy_ignore is saved')

      t.is(objects[1].notEncrypted, true, 'temp not encrypted value is merged in')
      t.is(objects[1].__cy_ignore, undefined, '__cy_ignore is not saved')

      t.is(objects[2].notEncrypted, 'other', 'not encrypted value is merged in')
      t.is(objects[2].notEncryptedTemp, true, 'temp not encrypted value is merged in')
      t.deepEqual(objects[2].cy_ignore, ['notEncrypted'], 'cy_ignore is saved')
      t.is(objects[2].__cy_ignore, undefined, '__cy_ignore is not saved')
    })

    .catch(t.end)
})

test('cryptoStore.findAll() should throw if plugin isn\'t unlocked', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.findAll()

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
      return hoodie.cryptoStore.findAll()
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
