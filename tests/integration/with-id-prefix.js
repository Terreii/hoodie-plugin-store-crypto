'use strict'

/*
 * Testing the cryptoStore.withIdPrefix method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var test = require('tape')
var Promise = require('lie')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.withIdPrefix() exists', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.withIdPrefix, 'function', 'has method')
})

test('cryptoStore.withIdPrefix("test/") returns scoped methods', function (t) {
  t.plan(13)

  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

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
    t.is(typeof cryptoStore[key], 'function', 'has method: ' + key)
  })
})

test('cryptoStore.withIdPrefix("test/").add(properties)', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return cryptoStore.add({ foo: 'bar' })
    })

    .then(function (object) {
      t.ok(/^test\//.test(object._id), 'prefixes id with "test/"')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.withIdPrefix("test/").add([doc1, doc2])', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return cryptoStore.add([{
        foo: 'bar'
      }, {
        baz: 'bar'
      }])
    })

    .then(function (objects) {
      t.ok(/^test\//.test(objects[0]._id), 'prefixes id with "test/"')
      t.ok(/^test\//.test(objects[1]._id), 'prefixes id with "test/"')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.withIdPrefix("test/").find("foo")', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test/foo',
        bar: 'baz'
      })
    })

    .then(function () {
      return cryptoStore.find('foo')
    })

    .then(function (object) {
      t.pass('finds doc')
      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").find("test/foo")', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test/foo',
        bar: 'baz'
      })
    })

    .then(function () {
      return cryptoStore.find('test/foo')
    })

    .then(function (object) {
      t.pass('finds doc')
      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").find(["foo", "test/bar"])', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var encrypted = hoodie.cryptoStore.add([{
        _id: 'test/foo'
      }, {
        _id: 'test/bar'
      }])
      var unencrypted = hoodie.store.add({
        _id: 'test/baz'
      })

      return Promise.all([encrypted, unencrypted])
    })

    .then(function () {
      return cryptoStore.find(['foo', 'test/bar', 'baz'])
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'test/foo', 'finds doc with _id: test/foo')
      t.is(objects[1]._id, 'test/bar', 'finds doc with _id: test/bar')
      t.is(objects[2]._id, 'test/baz', 'finds doc with _id: test/baz')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.withIdPrefix("test/").findOrAdd(id, object) when found', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test/foo',
        foo: 'bar'
      })
    })

    .then(function () {
      return cryptoStore.findOrAdd('foo', { foo: 'baz' })
    })

    .then(function (doc) {
      t.is(doc.foo, 'bar', 'finds doc')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").findOrAdd(id, object) when added', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return cryptoStore.findOrAdd('foo', { foo: 'baz' })
    })

    .then(function (object) {
      t.is(object.foo, 'baz', 'adds doc')
      t.ok(/^test\//.test(object._id), 'prefixes ._id')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").findOrAdd([object1, object2])', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test/foo',
        foo: 'bar'
      })
    })

    .then(function () {
      return cryptoStore.findOrAdd([{
        _id: 'foo',
        foo: 'baz'
      }, {
        _id: 'baz',
        baz: 'bar'
      }])
    })

    .then(function (objects) {
      t.is(objects[0].foo, 'bar', 'finds doc with _id: test/foo')
      t.is(objects[1].baz, 'bar', 'adds doc with _id: test/baz')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").findAll()', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{
        _id: 'test/foo'
      }, {
        _id: 'bar'
      }])
    })

    .then(function () {
      return cryptoStore.findAll()
    })

    .then(function (objects) {
      t.is(objects.length, 1)
      t.is(objects[0]._id, 'test/foo')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").update(id, changedProperties)', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test/foo',
        foo: 'bar'
      })
    })

    .then(function () {
      return cryptoStore.update('foo', { foo: 'baz' })
    })

    .then(function (object) {
      t.is(object.foo, 'baz')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").update([object1, object2])', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{
        _id: 'test/foo',
        foo: 'bar'
      }, {
        _id: 'test/bar',
        bar: 'baz'
      }])
    })

    .then(function () {
      return cryptoStore.update([{
        _id: 'test/foo',
        foo: 'bar2'
      }, {
        _id: 'test/bar',
        bar: 'baz2'
      }])
    })

    .then(function (objects) {
      t.is(objects.length, 2)
      t.is(objects[0].foo, 'bar2')
      t.is(objects[1].bar, 'baz2')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").updateOrAdd(object) when found', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test/foo',
        foo: 'bar'
      })
    })

    .then(function () {
      return cryptoStore.updateOrAdd('foo', { foo: 'baz' })
    })

    .then(function (object) {
      t.is(object.foo, 'baz', 'finds doc')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").updateOrAdd(object) when added', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return cryptoStore.updateOrAdd('foo', { foo: 'baz' })
    })

    .then(function (object) {
      t.is(object.foo, 'baz', 'finds doc')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").updateOrAdd([object1, object2])', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test/foo',
        foo: 'bar'
      })
    })

    .then(function () {
      return cryptoStore.updateOrAdd([{
        _id: 'foo',
        foo: 'baz'
      }, {
        _id: 'baz',
        baz: 'bar'
      }])
    })

    .then(function (objects) {
      t.is(objects[0].foo, 'baz', 'finds doc with _id: test/foo')
      t.is(objects[1].baz, 'bar', 'adds doc with _id: test/baz')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").updateAll(changedProperties)', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{
        _id: 'test/foo'
      }, {
        _id: 'bar'
      }])
    })

    .then(function () {
      return cryptoStore.updateAll({ foo: 'bar' })
    })

    .then(function (objects) {
      t.is(objects.length, 1)
      t.is(objects[0].foo, 'bar')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").remove(id)', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test/foo',
        foo: 'bar'
      })
    })

    .then(function () {
      return cryptoStore.remove('foo')
    })

    .then(function (object) {
      t.is(object._id, 'test/foo')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").remove([object1, id2])', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{
        _id: 'test/foo'
      }, {
        _id: 'bar'
      }])
    })

    .then(function () {
      return cryptoStore.remove([{
        _id: 'test/foo',
        foo: 'bar2'
      }, 'test/bar'])
    })

    .then(function (objects) {
      t.is(objects.length, 2)

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").removeAll()', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{
        _id: 'test/foo'
      }, {
        _id: 'bar'
      }])
    })

    .then(function () {
      return cryptoStore.removeAll()
    })

    .then(function (objects) {
      t.is(objects.length, 1)
      t.is(objects[0]._id, 'test/foo')

      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").withIdPrefix("onetwo/").add(properties)', function (t) {
  var hoodie = createCryptoStore()

  var cryptoStore = hoodie.cryptoStore.withIdPrefix('test/').withIdPrefix('onetwo/')

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return cryptoStore.add({
        foo: 'bar'
      })
    })

    .then(function (doc) {
      t.ok(/^test\/onetwo\//.test(doc._id), 'prefixes id with "test/onetwo/"')
      t.end()
    })

    .catch(t.error)
})

test('cryptoStore.withIdPrefix("test/").on("change", handler) events', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()
  var testStore = hoodie.cryptoStore.withIdPrefix('test/')

  testStore.on('change', function (eventName, object) {
    t.is(object._id, 'test/foo')
  })

  testStore.on('add', function (object) {
    t.is(object._id, 'test/foo')
  })

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      hoodie.cryptoStore.add({ _id: 'foo' })
      testStore.add({ _id: 'foo' })
    })

    .catch(function (err) {
      t.end(err)
    })
})
