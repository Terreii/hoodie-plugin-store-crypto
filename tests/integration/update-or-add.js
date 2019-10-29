'use strict'

/*
 * Testing the cryptoStore.updateOrAdd method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var test = require('tape')
var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.updateOrAdd(id, object) updates existing', function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var unencrypted = hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })
      var encrypted = hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar' })

      return Promise.all([unencrypted, encrypted])
    })

    .then(function () {
      var unencrypted = hoodie.cryptoStore.updateOrAdd('unencrypted', { foo: 'baz' })
      var encrypted = hoodie.cryptoStore.updateOrAdd('encrypted', { foo: 'baz' })

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

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.updateOrAdd(id, object) adds new if non-existent', function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd('newid', { foo: 'baz' })
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

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.updateOrAdd(id) fails with 400 error', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd('id')
    })

    .then(function () {
      t.fail("updateOrAdd didn't fail")
    })

    .catch(function (error) {
      t.is(error.status, 400, 'rejects with invalid request error')
    })
})

test('cryptoStore.updateOrAdd(object) updates existing', function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var unencrypted = hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })
      var encrypted = hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar' })

      return Promise.all([unencrypted, encrypted])
    })

    .then(function () {
      var unencrypted = hoodie.cryptoStore.updateOrAdd({ _id: 'unencrypted', foo: 'baz' })
      var encrypted = hoodie.cryptoStore.updateOrAdd({ _id: 'encrypted', foo: 'baz' })

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

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.updateOrAdd(object) adds new if non-existent', function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd({ _id: 'newid', foo: 'baz' })
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

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.updateOrAdd(object) without object._id fails with 400 error', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd({ foo: 'bar' })
    })

    .then(function () {
      t.fail("updateOrAdd didn't fail")
    })

    .catch(function (error) {
      t.is(error.status, 400, 'rejects with invalid request error')
    })
})

test('cryptoStore.updateOrAdd(array) updates existing, adds new', function (t) {
  t.plan(14)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var unencrypted = hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })
      var encrypted = hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar' })

      return Promise.all([unencrypted, encrypted])
    })

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd([
        { _id: 'unencrypted', foo: 'baz' },
        { _id: 'encrypted', foo: 'baz' },
        { _id: 'unknown', foo: 'baz' }
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

    .catch(function (err) {
      t.end(err)
    })
})

test(
  "cryptoStore.updateOrAdd() shouldn't encrypt fields in cy_ignore and __cy_ignore",
  function (t) {
    t.plan(12)

    var hoodie = createCryptoStore()

    hoodie.cryptoStore.setup('test')

      .then(function () {
        return hoodie.cryptoStore.unlock('test')
      })

      .then(function () {
        return hoodie.cryptoStore.updateOrAdd({
          _id: 'an_id',
          value: 42,
          notEncrypted: 'other',
          notEncryptedTemp: true,
          cy_ignore: ['notEncrypted'],
          __cy_ignore: ['notEncryptedTemp']
        })
      })

      .then(function (obj) {
        t.is(obj.__cy_ignore, undefined, '__cy_ignore was not saved')

        return hoodie.store.find(obj._id)
      })

      .then(function (obj) {
        t.is(obj.notEncrypted, 'other', 'fields listed in cy_ignore was not encrypted')
        t.is(obj.notEncryptedTemp, true, 'fields listed in __cy_ignore was not encrypted')

        return hoodie.cryptoStore.updateOrAdd(obj._id, {
          other: 789,
          __cy_ignore: ['value']
        })
      })

      .then(function (obj) {
        t.is(obj.value, 42, 'value exists')
        t.is(obj.other, 789, 'later added value exists')
        t.is(obj.notEncrypted, 'other', 'notEncrypted value as merged')
        t.is(obj.notEncryptedTemp, true, 'notEncryptedTemp exists')

        t.deepEqual(obj.cy_ignore, ['notEncrypted'], 'cy_ignore was saved')
        t.is(obj.__cy_ignore, undefined, '__cy_ignore was not saved')

        return hoodie.store.find(obj._id)
      })

      .then(function (obj) {
        t.is(obj.value, 42, 'encrypted value listed in __cy_ignore was decrypted')
        t.is(obj.notEncryptedTemp, undefined, 'not encrypted value was encrypted and deleted')
        t.is(obj.other, undefined, 'later added value was saved encrypted')
      })

      .catch(t.end)
  }
)

test("cryptoStore.updateOrAdd() shouldn't encrypt fields starting with _", async t => {
  t.plan(5)

  const hoodie = createCryptoStore()
  const hoodie2 = createCryptoStore({ notHandleSpecialDocumentMembers: true })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const obj = await hoodie.cryptoStore.updateOrAdd({
      _id: 'an_id',
      other: 42
    })
    await hoodie.cryptoStore.updateOrAdd(obj._id, {
      _value: 'test value'
    })

    t.fail(new Error('should have thrown with doc_validation'))
  } catch (err) {
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }

  try {
    await hoodie2.cryptoStore.setup('test')
    await hoodie2.cryptoStore.unlock('test')

    const obj = await hoodie2.cryptoStore.updateOrAdd({
      _id: 'an_id',
      _something: true,
      other: 42
    })
    t.is(obj._something, true, 'members with _ are added')

    const updated = await hoodie2.cryptoStore.updateOrAdd(obj._id, {
      _value: 'test value'
    })
    t.is(updated._value, 'test value', 'members with _ are added')

    const encrypted = await hoodie2.store.find(obj._id)
    t.is(encrypted.other, undefined, 'members still get encrypted')
    t.is(encrypted._value, undefined, 'members starting with _ are encrypted')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.updateOrAdd() should throw if plugin isn\'t unlocked', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.updateOrAdd('anId', { value: 'something' })

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
      return hoodie.cryptoStore.updateOrAdd('anId', { value: 'something' })
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
