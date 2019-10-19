'use strict'

/*
 * Testing the cryptoStore.add method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var test = require('tape')
var pouchdbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')

test('adds object to Store', function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function (salt) {
      return hoodie.cryptoStore.add({
        foo: 'bar'
      })
    })

    .then(function (object) {
      t.is(object.foo, 'bar', 'resolves with value')
      t.ok(object._id, 'gets a default _id')
      t.ok(object._rev, 'gets a _rev')
      t.ok(object.hoodie, 'resolves with the hoodie object')

      return hoodie.store.find(object._id)
    })

    .then(function (res) {
      t.is(res.foo, undefined, 'stored doc has no foo')
      t.ok(res.data, 'has encrypted data')
      t.ok(res.tag, 'has tag')
      t.ok(res.nonce, 'has nonce')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('fails for invalid object', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add()
    })

    .then(function () {
      t.fail("add didn't fail")
    })

    .catch(function (err) {
      t.ok(err instanceof Error, 'rejects with an error')
      t.is(err.status, 400, 'rejects with error 400')
      t.end()
    })
})

test('fails for existing object', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

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

    .then(function () {
      t.fail("add didn't fail")
    })

    .catch(function (err) {
      t.ok(err instanceof Error, 'rejects with an error')
      t.is(err.status, 409, 'rejects with error 409')
      t.end()
    })
})

test('adds multiple objects to db', function (t) {
  t.plan(19)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

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

      return hoodie.store.find([
        objects[0],
        objects[1],
        { _id: 'foo' }
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

    .catch(function (err) {
      t.end(err)
    })
})

test("cryptoStore.add() shouldn't encrypt fields in cy_ignore and __cy_ignore", function (t) {
  t.plan(4)

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
      t.deepEqual(obj.cy_ignore, ['notEncrypted'], 'cy_ignore was saved')
      t.is(obj.__cy_ignore, undefined, '__cy_ignore was not saved')

      return hoodie.store.find(obj._id)
    })

    .then(function (obj) {
      t.is(obj.notEncrypted, 'other', 'field in cy_ignore was not encrypted')
      t.is(obj.notEncryptedTemp, true, 'field in __cy_ignore was not encrypted')
    })

    .catch(t.end)
})

test("cryptoStore.add() doesn't encrypt fields starting with _ if option is set", function (t) {
  t.plan(3)

  var hoodie = createCryptoStore({ handleSpecialDocumentMembers: true })
  var hoodie2 = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        value: 42,
        _other: 'test value'
      })
    })

    .then(
      function (obj) {
        t.fail(new Error('should have thrown with doc_validation'))
      },
      function (err) {
        t.is(err.name, 'doc_validation', 'value with _ was passed on')
      }
    )

    .then(function () {
      return hoodie2.cryptoStore.setup('test')
    })

    .then(function () {
      return hoodie2.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie2.cryptoStore.add({
        value: 42,
        _other: 'test value'
      })
    })

    .then(function (obj) {
      t.is(obj._other, 'test value', 'members with _ are added')

      return hoodie2.store.find(obj._id)
    })

    .then(function (obj) {
      t.is(obj._other, undefined, 'member with _ was encrypted')
    })

    .catch(t.end)
})

test('cryptoStore.add() should throw if plugin isn\'t unlocked', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.add({ value: 'test' })

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
      return hoodie.cryptoStore.add({ value: 'test' })
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
