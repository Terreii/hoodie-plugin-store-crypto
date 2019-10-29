'use strict'

/*
 * Testing the cryptoStore.findOrAdd method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var test = require('tape')
var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.findOrAdd(id, object) finds existing', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({ _id: 'exists', foo: 'bar' })
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd('exists', { foo: 'baz' })
    })

    .then(function (object) {
      t.is(object._id, 'exists', 'resolves with id')
      t.is(object.foo, 'bar', 'resolves with old object')

      return hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd('unencrypted', { foo: 'baz' })
    })

    .then(function (object) {
      t.is(object._id, 'unencrypted', 'resolves with id')
      t.is(object.foo, 'bar', 'resolves with old object')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.findOrAdd(id, object) adds new', function (t) {
  t.plan(5)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd('newId', { foo: 'bar' })
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

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.findOrAdd(id) fails if no object exists', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd('an-id')
    })

    .then(function () {
      t.fail("findOrAdd didn't fail")
    })

    .catch(function (err) {
      t.is(err.status, 412, 'rejects with 412 error')
    })
})

test('cryptoStore.findOrAdd(object) finds existing', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar' })
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd({ _id: 'encrypted', foo: 'baz' })
    })

    .then(function (object) {
      t.is(object._id, 'encrypted', 'resolves with id')
      t.is(object.foo, 'bar', 'resolves with old object')

      return hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd({ _id: 'unencrypted', foo: 'baz' })
    })

    .then(function (object) {
      t.is(object._id, 'unencrypted', 'resolves with id')
      t.is(object.foo, 'bar', 'resolves with old object')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.findOrAdd(object) adds new', function (t) {
  t.plan(5)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd({ _id: 'newId', foo: 'bar' })
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

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.findOrAdd(object) fails if object has no id', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd({ foo: 'bar' })
    })

    .then(function () {
      t.fail("findOrAdd didn't fail")
    })

    .catch(function (err) {
      t.is(err.status, 412, 'rejects with 412 error')
    })
})

test('cryptoStore.findOrAdd([object1, object2])', function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var encrypted = hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar' })
      var unencrypted = hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })

      return Promise.all([encrypted, unencrypted])
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd([
        { _id: 'encrypted', foo: 'baz' },
        { _id: 'unencrypted', foo: 'baz' },
        { _id: 'added', foo: 'baz' }
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

    .catch(function (err) {
      t.end(err)
    })
})

test("cryptoStore.findOrAdd() shouldn't encrypt fields in cy_ignore and __cy_ignore", function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.findOrAdd({
        _id: 'an_id',
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

      return hoodie.cryptoStore.findOrAdd(obj)
    })

    .then(function (obj) {
      t.is(obj.value, 42, 'value was encrypted')
      t.is(obj.notEncrypted, 'other', 'not encrypted fields are merged in')
      t.is(obj.notEncryptedTemp, true, 'not encrypted fields are merged in')
      t.deepEqual(obj.cy_ignore, ['notEncrypted'], 'cy_ignore is saved')
    })

    .catch(t.end)
})

test("cryptoStore.findOrAdd() shouldn't encrypt fields starting with _", async t => {
  t.plan(3)

  const hoodie = createCryptoStore()
  const hoodie2 = createCryptoStore({ notHandleSpecialDocumentMembers: true })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.findOrAdd({
      _id: 'someId',
      value: 42,
      _other: 'test value'
    })
    t.fail(new Error('should have thrown with doc_validation'))
  } catch (err) {
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }

  try {
    await hoodie2.cryptoStore.setup('test')
    await hoodie2.cryptoStore.unlock('test')

    const obj = await hoodie2.cryptoStore.findOrAdd({
      _id: 'someId',
      value: 42,
      _other: 'test value'
    })
    t.is(obj._other, 'test value', 'members with _ are added')

    const encrypted = await hoodie2.store.find(obj._id)
    t.is(encrypted._other, undefined, 'member with _ was encrypted')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.findOrAdd() should throw if plugin isn\'t unlocked', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.findOrAdd('anId', { value: 'something' })

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
      return hoodie.cryptoStore.findOrAdd('anId', { value: 'something' })
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
