'use strict'

/*
 * Testing the cryptoStore.removeAll method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var test = require('tape')
var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')
var checkTime = require('../utils/checkTime')

test('cryptoStore.removeAll()', function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var unencrypted = hoodie.store.add({ _id: 'unencrypted', foo: 'bar' })
      var encrypted = hoodie.cryptoStore.add([
        { _id: 'encrypted', foo: 'bar' },
        { foo: 'bar', bar: 'foo' }
      ])

      return Promise.all([unencrypted, encrypted])
    })

    .then(function () {
      return hoodie.cryptoStore.removeAll()
    })

    .then(function (objects) {
      t.is(objects.length, 3, 'resolves all')
      t.is(objects[0].foo, 'bar', 'resolves with properties')

      objects.forEach(function (object) {
        t.is(parseInt(object._rev, 10), 2, 'new revision')
      })
    })

    .then(function () {
      return hoodie.store.findAll()
    })

    .then(function (objects) {
      var filtered = objects.filter(function (object) {
        return /^hoodiePluginCryptoStore\//.test(object._id) !== true
      })
      t.is(filtered.length, 0, 'no objects can be found in store')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.removeAll(filterFunction)', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()
  var cryptoStoreDocs = []

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.store.withIdPrefix('hoodiePluginCryptoStore/').findAll()
    })

    .then(function (foundCryptoStoreDocs) {
      cryptoStoreDocs = foundCryptoStoreDocs

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
      return hoodie.cryptoStore.removeAll(function (object) {
        return typeof object.foo === 'number'
      })
    })

    .then(function (objects) {
      t.is(objects.length, 4, 'removes 4 objects')
    })

    .then(function () {
      return hoodie.store.findAll()
    })

    .then(function (objects) {
      var otherDocs = objects.filter(function (doc) {
        return !/^hoodiePluginCryptoStore/.test(doc._id)
      })
      t.is(otherDocs.length, 3, 'does not remove other 3 objects')

      var ids = objects.map(function (doc) { return doc._id })
      t.ok(cryptoStoreDocs.length > 0 && cryptoStoreDocs.every(function (doc) {
        return ids.indexOf(doc._id) !== -1
      }), 'does not remove "hoodiePluginCryptoStore/" docs')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test("cryptoStore.removeAll() doesn't remove _design docs or plugin's docs", function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{ foo: 'bar' }, { _id: '_design/bar' }])
    })

    .then(function () {
      return hoodie.cryptoStore.removeAll()
    })

    .then(function (objects) {
      t.is(
        objects.length,
        1,
        'resolves everything but _design/bar and hoodiePluginCryptoStore/salt'
      )
      t.isNot(objects[0]._id, '_design/bar', 'resolved doc isn\'t _design/bar')
    })

    .then(function () {
      return hoodie.store.db.get('_design/bar')
    })

    .then(function (doc) {
      t.is(doc._id, '_design/bar', 'check _design/bar still exists')
      t.isNot(doc._deleted, true, '_design/bar is not deleted')

      return hoodie.store.db.get('hoodiePluginCryptoStore/salt')
    })

    .then(function (doc) {
      t.is(
        doc._id,
        'hoodiePluginCryptoStore/salt',
        'check hoodiePluginCryptoStore/salt still exists'
      )
      t.isNot(doc._deleted, true, 'hoodiePluginCryptoStore/salt is not deleted')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.removeAll([objects]) creates deletedAt timestamps', function (t) {
  t.plan(10)

  var hoodie = createCryptoStore()

  var startTime = null

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([
        { foo: 'bar' },
        { foo: 'baz' }
      ])
    })

    .then(function () {
      return new Promise(function (resolve) {
        setTimeout(resolve, 100)
      })
    })

    .then(function () {
      startTime = new Date()
      return hoodie.cryptoStore.removeAll()
    })

    .then(function (objects) {
      objects.forEach(function (object) {
        t.ok(object._id, 'resolves doc')
        t.ok(object.hoodie.createdAt, 'should have createdAt timestamp')
        t.ok(object.hoodie.updatedAt, 'should have updatedAt timestamp')
        t.ok(object.hoodie.deletedAt, 'should have deleteAt timestamp')
        t.ok(
          checkTime(startTime, object.hoodie.deletedAt),
          'deletedAt should be the same time as right now'
        )
      })
    })

    .catch(function (err) {
      t.end(err)
    })
})

test("cryptoStore.removeAll() shouldn't encrypt fields in cy_ignore and __cy_ignore", function (t) {
  t.plan(4)

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
          notEncrypted: 'other',
          notEncryptedTemp: true,
          cy_ignore: ['notEncrypted'],
          __cy_ignore: ['notEncryptedTemp']
        }
      ])
    })

    .then(function () {
      return hoodie.cryptoStore.removeAll()
    })

    .catch(t.end)

  hoodie.store.on('remove', function (obj) {
    switch (obj._id) {
      case 'a_with_cy_ignore':
        t.is(
          obj.notEncrypted,
          'other',
          'field listed in cy_ignore is not encrypted after an update'
        )
        break

      case 'b_with___cy_ignore':
        t.is(obj.notEncrypted, undefined, 'not encrypted value was encrypted and deleted')
        break

      case 'c_with_both':
        t.is(
          obj.notEncrypted,
          'other',
          'field listed in cy_ignore is not encrypted after an update'
        )
        t.is(obj.notEncryptedTemp, undefined, 'not encrypted value was encrypted and deleted')
        break

      default:
        t.fail('unknown id')
    }
  })
})

test(
  "cryptoStore.removeAll() shouldn't encrypt fields starting with _ if option is set",
  function (t) {
    t.plan(6)

    var hoodie = createCryptoStore({ handleSpecialDocumentMembers: true })
    var hoodie2 = createCryptoStore()

    hoodie.cryptoStore.setup('test')

      .then(function () {
        return hoodie.cryptoStore.unlock('test')
      })

      .then(function () {
        return hoodie.cryptoStore.add([
          {
            _id: 'a',
            value: 42,
            _other: 'test value'
          },
          {
            _id: 'b',
            _value: 42,
            other: 'test value'
          }
        ])
      })

      .then(function () {
        return hoodie.cryptoStore.removeAll()
      })

      .then(
        function (objects) {
          t.ok(objects instanceof Error, 'Update should have failed')
          t.fail('Update should have failed')
        },
        function (err) {
          t.ok(err instanceof Error, 'Update did fail')
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
        return hoodie2.cryptoStore.add([
          {
            _id: 'a',
            value: 42,
            _other: 'test value'
          },
          {
            _id: 'b',
            _value: 42,
            other: 'test value'
          }
        ])
      })

      .then(function () {
        return hoodie2.cryptoStore.removeAll()
      })

      .catch(t.end)

    hoodie2.store.on('remove', function (obj) {
      switch (obj._id) {
        case 'a':
          t.is(obj.value, undefined, 'values still get encrypted')
          t.is(obj._other, undefined, 'values starting with _ are encrypted')
          break

        case 'b':
          t.is(obj.other, undefined, 'values still get encrypted')
          t.is(obj._value, undefined, 'values starting with _ are encrypted')
          break

        default:
          t.fail('unknown id')
      }
    })
  }
)

test('cryptoStore.removeAll() should throw if plugin isn\'t unlocked', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.removeAll()

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
      return hoodie.cryptoStore.removeAll()
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
