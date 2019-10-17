'use strict'

/*
 * Testing the cryptoStore.find method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var test = require('tape')
var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.find(id)', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

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

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.find(object)', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'foo',
        bar: 'baz'
      })
    })

    .then(function () {
      return hoodie.cryptoStore.find({ _id: 'foo' })
    })

    .then(function (doc) {
      t.is(doc._id, 'foo', 'resolves _id')
      t.is(doc.bar, 'baz', 'resolves value')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('find unencrypted objects', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

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
      var first = hoodie.cryptoStore.find('foo')

        .then(function (object) {
          t.is(object._id, 'foo', 'resolves id')
          t.is(object.bar, 'baz', 'resolves value')
        })

      var second = hoodie.cryptoStore.find({ _id: 'bar' })

        .then(function (object) {
          t.is(object._id, 'bar', 'resolves id')
          t.is(object.foo, 'baz', 'resolves value')
        })

      return Promise.all([first, second])
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('find rejects with hoodie.find error for non-existing', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'unrelated'
      })
    })

    .then(function () {
      var first = hoodie.cryptoStore.find('foo')

        .catch(function (err) {
          t.ok(err instanceof Error, 'rejects error')
          t.is(err.status, 404)
        })

      var second = hoodie.cryptoStore.find({ _id: 'foo' })

        .catch(function (err) {
          t.ok(err instanceof Error, 'rejects error')
          t.is(err.status, 404)
        })

      return Promise.all([first, second])
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.find(array)', function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

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
      return hoodie.cryptoStore.find(['foo', { _id: 'bar' }, 'baz'])
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'foo', 'resolves id')
      t.is(objects[0].bar, 'baz', 'resolves value')
      t.is(objects[1]._id, 'bar', 'resolves id')
      t.is(objects[1].foo, 'baz', 'resolves value')
      t.is(objects[2]._id, 'baz', 'resolves id')
      t.is(objects[2].baz, 'foo', 'resolves value')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.find(array) with non-existing', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

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

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.find() should merge not encrypt fields into the result object', function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        value: 42,
        notEncrypted: 'other',
        notEncryptedTemp: true,
        cy_ignore: ['notEncrypted'],
        __cy_ignore: ['notEncryptedTemp']
      })
    })

    .then(function (obj) {
      return hoodie.store.update(obj._id, { other: 'something public' })
    })

    .then(function (obj) {
      return hoodie.cryptoStore.find(obj._id)
    })

    .then(function (obj) {
      t.is(obj.value, 42, 'encrypted value was decrypted')
      t.is(obj.notEncrypted, 'other', 'not encrypted field listed in cy_ignore')
      t.is(obj.notEncryptedTemp, true, 'not encrypted field listed in __cy_ignore')
      t.deepEqual(obj.cy_ignore, ['notEncrypted'], 'cy_ignore was saved')
      t.is(obj.__cy_ignore, undefined, '__cy_ignore was not saved')
      t.is(obj.other, 'something public', 'later added not encrypted value was merged in')
    })

    .catch(t.end)
})

test('cryptoStore.find() should throw if plugin isn\'t unlocked', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.find('anId')

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
      return hoodie.cryptoStore.find('anId')
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

// todo: check for timestamps
