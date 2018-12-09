'use strict'

/*
 * Testing the cryptoStore.update method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var test = require('tape')
var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')
var checkTime = require('../utils/checkTime')

test('cryptoStore.update(id, changedProperties)', function (t) {
  t.plan(10)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.store.add({ _id: 'exists', foo: 'bar' })
    })

    .then(function () {
      return hoodie.cryptoStore.update('exists', { foo: 'baz' })
    })

    .then(function (object) {
    // encrypt existing unencrypted object
      t.ok(object._id)
      t.ok(/^2-/.test(object._rev), 'revision is 2')
      t.is(object.foo, 'baz', 'passes properties')

      return hoodie.cryptoStore.update('exists', { foo: 'foo' })
    })

    .then(function (object) {
    // update existing encrypted object
      t.ok(object._id)
      t.ok(/^3-/.test(object._rev), 'revision is 3')
      t.is(object.foo, 'foo', 'passes properties')

      return hoodie.store.find('exists')
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

test('cryptoStore.update(id)', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.update('nothinghere')
    })

    .then(function () {
      t.fail("update didn't fail")
    })

    .catch(function (err) {
      t.ok(err instanceof Error, 'rejects error')
    })
})

test(
  'cryptoStore.update("unknown", changedProperties) returns custom not found error',
  function (t) {
    t.plan(3)

    var hoodie = createCryptoStore()

    hoodie.cryptoStore.setup('test')

      .then(function () {
        return hoodie.cryptoStore.unlock('test')
      })

      .then(function () {
        return hoodie.cryptoStore.update('unknown', { foo: 'bar' })
      })

      .then(function () {
        t.fail("update didn't fail")
      })

      .catch(function (err) {
        t.ok(err instanceof Error, 'rejects error')
        t.is(err.name, 'Not found', 'rejects with custom name')
        t.is(err.message, 'Object with id "unknown" is missing', 'rejects with custom message')
      })
  }
)

test('cryptoStore.update(id, updateFunction)', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({ _id: 'exists' })
    })

    .then(function () {
      return hoodie.cryptoStore.update('exists', function (object) {
        object.foo = object._id + 'bar'
      })
    })

    .then(function (object) {
      t.ok(object._id)
      t.ok(/^2-/.test(object._rev))
      t.is(object.foo, 'existsbar', 'resolves properties')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.update(object)', function (t) {
  t.plan(10)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.store.add({ _id: 'exists', foo: 'bar' })
    })

    .then(function () {
      return hoodie.cryptoStore.update({ _id: 'exists', foo: 'baz' })
    })

    .then(function (object) {
    // encrypt existing unencrypted object
      t.ok(object._id)
      t.ok(/^2-/.test(object._rev), 'revision is 2')
      t.is(object.foo, 'baz', 'passes properties')

      return hoodie.cryptoStore.update({ _id: 'exists', foo: 'foo' })
    })

    .then(function (object) {
    // update existing encrypted object
      t.ok(object._id)
      t.ok(/^3-/.test(object._rev), 'revision is 3')
      t.is(object.foo, 'foo', 'passes properties')

      return hoodie.store.find('exists')
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

test('cryptoStore.update(array)', function (t) {
  t.plan(14)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var encrypted = hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar', bar: 'foo' })
      var unencrypted = hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })

      return Promise.all([encrypted, unencrypted])
    })

    .then(function () {
      return hoodie.cryptoStore.update([
        { _id: 'encrypted', bar: 'baz' },
        { _id: 'unencrypted', bar: 'baz' }
      ])
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'encrypted')
      t.is(objects[0].foo, 'bar')
      t.is(objects[0].bar, 'baz')

      t.is(objects[1]._id, 'unencrypted')
      t.is(objects[1].foo, 'bar')
      t.is(objects[1].bar, 'baz')

      return hoodie.store.find(['encrypted', 'unencrypted'])
    })

    .then(function (objects) {
      t.is(objects[0].foo, undefined, 'stored doc has no foo')
      t.ok(objects[0].data, 'has encrypted data')
      t.ok(objects[0].tag, 'has tag')
      t.ok(objects[0].nonce, 'has nonce')

      t.is(objects[1].foo, undefined, 'stored doc has no foo')
      t.ok(objects[1].data, 'has encrypted data')
      t.ok(objects[1].tag, 'has tag')
      t.ok(objects[1].nonce, 'has nonce')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.update(array) with non-existent and invalid objects', function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([
        { _id: 'exists' },
        { _id: 'foo' }
      ])
    })

    .then(function () {
      return hoodie.cryptoStore.update([
        { _id: 'exists', foo: 'bar' },
        { _id: 'unknown', foo: 'baz' },
        'foo',
        []
      ])
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'exists')
      t.is(objects[0].foo, 'bar')
      t.is(parseInt(objects[0]._rev, 10), 2)
      t.is(objects[1].status, 404)
      t.is(objects[1].name, 'Not found', 'rejects with custom name for unknown')
      t.is(
        objects[1].message,
        'Object with id "unknown" is missing',
        'rejects with custom message for unknown'
      )
      t.is(objects[2].status, 400)
      t.is(objects[3].status, 404)
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.update(array, changedProperties)', function (t) {
  t.plan(12)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var encrypted = hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'foo', bar: 'foo' })
      var unencrypted = hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })

      return Promise.all([encrypted, unencrypted])
    })

    .then(function () {
      return hoodie.cryptoStore.update([{ _id: 'encrypted' }, 'unencrypted', 'unknown'], {
        bar: 'baz'
      })
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'encrypted')
      t.is(objects[0].foo, 'foo')
      t.is(objects[0].bar, 'baz')
      t.is(parseInt(objects[0]._rev, 10), 2)

      t.is(objects[1]._id, 'unencrypted')
      t.is(objects[1].foo, 'bar')
      t.is(objects[1].bar, 'baz')

      t.is(objects[2].status, 404)

      return hoodie.store.find('unencrypted')
    })

    .then(function (object) {
      t.is(object.foo, undefined, 'stored doc has no foo')
      t.ok(object.data, 'has encrypted data')
      t.ok(object.tag, 'has tag')
      t.ok(object.nonce, 'has nonce')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.update(array, updateFunction)', function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var encrypted = hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'foo', bar: 'foo' })
      var unencrypted = hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })

      return Promise.all([encrypted, unencrypted])
    })

    .then(function () {
      return hoodie.cryptoStore.update(['encrypted', 'unencrypted'], function (doc) {
        doc.bar = doc._id + 'baz'
      })
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'encrypted')
      t.is(objects[0].foo, 'foo')
      t.is(objects[0].bar, 'encryptedbaz')

      t.is(objects[1]._id, 'unencrypted')
      t.is(objects[1].foo, 'bar')
      t.is(objects[1].bar, 'unencryptedbaz')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.update(object) updates updatedAt timestamp', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  var startTime = null

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({ _id: 'shouldHaveTimestamps' })
    })

    .then(function () {
      return new Promise(function (resolve, reject) {
        setTimeout(resolve, 1000)
      })
    })

    .then(function () {
      startTime = new Date()
      return hoodie.cryptoStore.update({
        _id: 'shouldHaveTimestamps',
        foo: 'bar'
      })
    })

    .catch(function (err) {
      t.end(err)
    })

  hoodie.store.on('update', function (object) {
    t.is(object._id, 'shouldHaveTimestamps', 'resolves doc')
    t.is(typeof object.hoodie.deletedAt, 'undefined', 'deletedAt shouldnt be set')
    t.ok(
      checkTime(startTime, object.hoodie.updatedAt),
      'updatedAt should be the same time as right now'
    )
    t.not(object.hoodie.createdAt, object.hoodie.updatedAt, 'createdAt and updatedAt should not be the same')
  })
})

test('cryptoStore.update([objects]) updates updatedAt timestamps', function (t) {
  t.plan(8)

  var hoodie = createCryptoStore()

  var startTime = null

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var encrypted = hoodie.cryptoStore.add({ _id: 'encrypted' })
      var unencrypted = hoodie.store.add({ _id: 'unencrypted' })

      return Promise.all([encrypted, unencrypted])
    })

    .then(function () {
      return new Promise(function (resolve, reject) {
        setTimeout(resolve, 1000)
      })
    })

    .then(function () {
      startTime = new Date()
      return hoodie.cryptoStore.update(['encrypted', 'unencrypted'], { foo: 'bar' })
    })

    .catch(function (err) {
      t.end(err)
    })

  hoodie.store.on('update', function (object) {
    t.ok(object._id, 'resolves doc')
    t.is(typeof object.hoodie.deletedAt, 'undefined', 'deletedAt shouldnt be set')
    t.ok(
      checkTime(startTime, object.hoodie.updatedAt),
      'updatedAt should be the same time as right now'
    )
    t.not(object.hoodie.createdAt, object.hoodie.updatedAt, 'createdAt and updatedAt should not be the same')
  })
})

test('cryptoStore.update(object) ignores .hoodie property', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({ _id: 'exists' })
    })

    .then(function () {
      return hoodie.cryptoStore.update({
        _id: 'exists',
        foo: 'bar',
        hoodie: { ignore: 'me' }
      })
    })

    .then(function (object) {
      t.ok(object._id, 'resolves with id')
      t.ok(/^2-/.test(object._rev), 'resolves with new rev number')
      t.is(object.foo, 'bar', 'resolves with properties')
      t.is(object.hoodie.ignore, undefined, 'ignores .hoodie property')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.update(array)', function (t) {
  t.plan(7)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([
        { _id: '1', foo: 'foo', bar: 'foo' },
        { _id: '2', foo: 'bar' }
      ])
    })

    .then(function () {
      return hoodie.cryptoStore.update([
        { _id: '1', bar: 'baz', hoodie: { ignore: 'me' } },
        { _id: '2', bar: 'baz' }
      ])
    })

    .then(function (objects) {
      t.is(objects[0]._id, '1')
      t.is(objects[0].foo, 'foo')
      t.is(objects[0].bar, 'baz')
      t.is(objects[0].hoodie.ignore, undefined)

      t.is(objects[1]._id, '2')
      t.is(objects[1].foo, 'bar')
      t.is(objects[1].bar, 'baz')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.update() should throw if plugin isn\'t unlocked', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.update('anId', { value: 'something' })

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
      return hoodie.cryptoStore.update('anId', { value: 'something' })
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
