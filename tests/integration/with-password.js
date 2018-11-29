'use strict'

var test = require('tape')
var Promise = require('lie')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore has a withPassword method', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.withPassword, 'function', 'method exist')

  var testStore = hoodie.cryptoStore.withIdPrefix('test/')

  t.is(typeof testStore.withPassword, 'undefined', "withIdPrefix store doesn't have it")
})

test('cryptoStore.withPassword returns scoped methods', function (t) {
  t.plan(13)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.withPassword('test')

    .then(function (result) {
      var testStore = result.store

      ;[
        'add',
        'find',
        'findAll',
        'findOrAdd',
        'update',
        'updateOrAdd',
        'updateAll',
        'remove',
        'removeAll',
        'withIdPrefix',
        'on',
        'one',
        'off'
      ].forEach(function (key) {
        t.is(typeof testStore[key], 'function', 'has method: ' + key)
      })
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.withPassword("test") returns salt', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.withPassword('test')

    .then(function (result) {
      t.is(typeof result.salt, 'string', 'returns salt')
      t.is(result.salt.length, 32, 'salt has correct length')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.withPassword("test").add(properties)', function (t) {
  t.plan(5)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('foo')

    .then(function () {
      return hoodie.cryptoStore.unlock('foo')
    })

    .then(function () {
      return hoodie.cryptoStore.withPassword('test')
    })

    .then(function (results) {
      var testStore = results.store

      testStore.add({
        _id: 'test_encryped',
        foo: 'bar'
      })

        .then(function (object) {
          t.is(object._id, 'test_encryped', 'id is unchaned')

          return hoodie.store.find('test_encryped')
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

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.withPassword("test").find(properties)', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  Promise.all([
    hoodie.cryptoStore.withPassword('test'),
    hoodie.cryptoStore.setup('foo')

      .then(function () {
        return hoodie.cryptoStore.unlock('foo')
      })
  ])

    .then(function (stores) {
      var testStore = stores[0].store

      testStore.add({ foo: 'bar' })

        .then(function (object) {
          return testStore.find(object._id)
        })

        .then(function (object) {
          t.is(object.foo, 'bar', 'resolves value')
        })

        .catch(function (err) {
          t.end(err)
        })
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('createCryptoStore.withPassword("test").find() fails with wrong password', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  var objectWrite = hoodie.cryptoStore.setup('foo')

    .then(function () {
      return hoodie.cryptoStore.unlock('foo')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'foo',
        bar: 'baz'
      })
    })

  Promise.all([
    hoodie.cryptoStore.withPassword('test'),
    objectWrite
  ])

    .then(function (results) {
      var testStore = results[0].store

      return testStore.find('foo')
    })

    .then(function (decrypted) {
      t.fail('should throw an TypeError')
    })

    .catch(function (err) {
      t.is(err.name, 'Error')
    })
})

test('cryptoStore.withPassword("test", salt) encrypts the same', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.withPassword('test')

    .then(function (result) {
      var testStore = result.store
      var salt = result.salt

      return testStore.add({
        _id: 'foo',
        bar: 'baz'
      })

        .then(function () {
          return hoodie.cryptoStore.withPassword('test', salt)
        })

        .then(function (results) {
          return results.store.find('foo')
        })

        .then(function (object) {
          t.is(object._id, 'foo', 'resolves with id')
          t.is(object.bar, 'baz', 'resolves with values')
        })
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('createCryptoStore.withPassword("test").update(properties) changes object', function (t) {
  t.plan(5)

  var hoodie = createCryptoStore()

  var objectWrite = hoodie.cryptoStore.setup('foo')

    .then(function () {
      return hoodie.cryptoStore.unlock('foo')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'foo',
        bar: 'baz'
      })
    })

  Promise.all([
    hoodie.cryptoStore.withPassword('test'),
    objectWrite
  ])

    .then(function (results) {
      var testStore = results[0].store
      var original = results[1]

      return hoodie.store.find('foo')

        .then(function (unencrypted) {
          return testStore.update(original)

            .then(function () {
              return hoodie.store.find('foo')
            })

            .then(function (updated) {
              return [updated, unencrypted]
            })
        })
    })

    .then(function (results) {
      t.equal(results[0]._id, results[1]._id, "_id didn't change")
      t.notEqual(results[0]._rev, results[1]._rev, '_rev did change')
      t.notEqual(results[0].data, results[1].data, 'data did change')
      t.notEqual(results[0].tag, results[1].tag, 'tag did change')
      t.notEqual(results[0].nonce, results[1].nonce, 'nonce did change')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test(
  'createCryptoStore.withPassword("test").on() should only emit an event for object with its password',
  function (t) {
    t.plan(11)

    var hoodie = createCryptoStore()

    Promise.all([
      hoodie.cryptoStore.withPassword('test'),
      hoodie.cryptoStore.setup('foo')

        .then(function () {
          return hoodie.cryptoStore.unlock('foo')
        })
    ])

      .then(function (stores) {
        var testStore = stores[0].store

        var eventCount = 0
        testStore.on('change', function (eventName, object) {
          switch (eventCount) {
            case 0:
              t.is(eventName, 'add', 'event is the add event')
              t.is(object._id, 'test', 'the correct object was added')
              t.is(object.bar, 'baz', 'the correct object was added')
              break

            case 1:
              t.is(eventName, 'update', 'event is a update event')
              t.is(object._id, 'foo', 'the correct object was added')
              t.is(object.foo, 'bar', 'the correct object was added')
              t.is(object.bar, 'baz', 'the correct object was added')
              break

            case 2:
              t.is(eventName, 'update', 'event is a update event')
              t.is(object._id, 'test', 'the correct object was added')
              t.is(object.foo, 'bar', 'the correct object was added')
              t.is(object.bar, 'baz', 'the correct object was added')
              break

            default:
              t.error(new Error('unexpected number of events! Event number: ' + eventCount))
              return
          }
          eventCount += 1
        })

        hoodie.cryptoStore.add({
          foo: 'bar'
        })

          .then(function () {
            return testStore.add({
              _id: 'test',
              bar: 'baz'
            })
          })

          .then(function () {
            return hoodie.store.add({
              _id: 'foo',
              foo: 'bar'
            })
          })

          .then(function () {
            return testStore.update({
              _id: 'foo',
              bar: 'baz'
            })
          })

          .then(function () {
            return testStore.update({
              _id: 'test',
              foo: 'bar'
            })
          })

          .then(function () {
            t.end()
          })

          .catch(function (err) {
            t.end(err)
          })
      })
  }
)
