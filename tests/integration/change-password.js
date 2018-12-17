'use strict'

var test = require('tape')
var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.changePassword should only exist on the root api', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.changePassword, 'function', 'exist on top-level')

  var prefixStore = hoodie.cryptoStore.withIdPrefix('test/')

  t.is(typeof prefixStore.changePassword, 'undefined', "doesn't exist on prefix store api")

  hoodie.cryptoStore.withPassword('test')

    .then(function (result) {
      var passwordStore = result.store

      t.is(
        typeof passwordStore.changePassword,
        'undefined',
        "doesn't exist on withPassword store api"
      )
    })

    .catch(function (err) {
      t.end(err)
    })
})

test(
  'cryptoStore.changePassword(oldPassword, newPassword) should resolve with a report, including' +
    ' the new salt and an array of not updated ids',
  function (t) {
    t.plan(5)

    var hoodie = createCryptoStore()

    hoodie.cryptoStore.setup('test')

      .then(function () {
        return hoodie.cryptoStore.unlock('test')
      })

      .then(function () {
        return hoodie.cryptoStore.changePassword('test', 'foo')
      })

      .then(function (report) {
        t.is(typeof report.salt, 'string', 'salt is a string')
        t.is(report.salt.length, 32, 'salt has the correct length')
        t.ok(Array.isArray(report.notUpdated), 'has a array of not updated IDs')
        t.is(report.notUpdated.length, 0, 'array has a length of 0')

        return hoodie.store.find('hoodiePluginCryptoStore/salt')

          .then(function (saltObj) {
            t.is(saltObj.salt, report.salt, 'stored salt was updated')
          })
      })

      .catch(function (err) {
        t.end(err)
      })
  }
)

test(
  'cryptoStore.changePassword(oldPassword, newPassword) should change the crypto key',
  function (t) {
    t.plan(4)

    var hoodie = createCryptoStore()

    hoodie.cryptoStore.setup('test')

      .then(function () {
        return hoodie.cryptoStore.unlock('test')
      })

      .then(function () {
        return hoodie.cryptoStore.add({ foo: 'bar' })
      })

      .then(function (object) {
        var unencrypted = hoodie.store.find(object._id)

        return Promise.all([object, unencrypted])
      })

      .then(function (results) {
        var object = results[0]
        var unencrypted = results[1]

        return hoodie.cryptoStore.changePassword('test', 'baz')

          .then(function () {
            return hoodie.cryptoStore.update(object)
          })

          .then(function (updated) {
            return hoodie.store.find(updated._id)
          })

          .then(function (updated) {
            t.equal(unencrypted._id, updated._id, 'id is the same')
            t.notEqual(unencrypted.data, updated.data, 'data did change')
            t.notEqual(unencrypted.tag, updated.tag, 'tag did change')
            t.notEqual(unencrypted.nonce, updated.nonce, 'nonce did change')
          })
      })

      .catch(function (err) {
        t.end(err)
      })
  }
)

test('cryptoStore.changePassword(oldPassword, newPassword) should update existing objects', function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'testObj',
        foo: 'bar'
      })
    })

    .then(function () {
      return hoodie.store.find('testObj')
    })

    .then(function (oldUnencrypted) {
      return hoodie.cryptoStore.changePassword('test', 'foo')

        .then(function () {
          var object = hoodie.cryptoStore.find('testObj')
          var unencrypted = hoodie.store.find('testObj')

          return Promise.all([object, unencrypted])
        })

        .then(function (result) {
          var object = result[0]
          var newUnencrypted = result[1]

          t.equal(oldUnencrypted._id, newUnencrypted._id, "_id didn't change")
          t.notEqual(oldUnencrypted._rev, newUnencrypted._rev, '_rev did change')
          t.notEqual(oldUnencrypted.data, newUnencrypted.data, 'data did change')
          t.notEqual(oldUnencrypted.tag, newUnencrypted.tag, 'tag did change')
          t.notEqual(oldUnencrypted.nonce, newUnencrypted.nonce, 'nonce did change')

          t.is(object.foo, 'bar', "data didn't change")
        })
    })

    .catch(function (err) {
      t.end(err)
    })
})

test(
  "cryptoStore.changePassword(oldPassword, newPassword) should fail if the old password doesn't match",
  function (t) {
    t.plan(1)

    var hoodie = createCryptoStore()

    hoodie.cryptoStore.setup('test')

      .then(function () {
        return hoodie.cryptoStore.unlock('test')
      })

      .then(function () {
        return hoodie.cryptoStore.changePassword('foo', 'bar')
      })

      .then(function () {
        t.fail('should throw an Error')
      })

      .catch(function (error) {
        t.is(error.message, pouchdbErrors.UNAUTHORIZED.message, 'fails with error message')
      })
  }
)

test(
  'cryptoStore.changePassword(oldPassword, newPassword) should fail if there is no new password',
  function (t) {
    t.plan(2)

    var hoodie = createCryptoStore()

    hoodie.cryptoStore.setup('test')

      .then(function () {
        return hoodie.cryptoStore.unlock('test')
      })

      .then(function () {
        return hoodie.cryptoStore.changePassword('test')
      })

      .then(function () {
        t.fail('should throw an Error')
      })

      .catch(function (error) {
        t.is(error.message, pouchdbErrors.BAD_ARG.message, 'fails with pouchdb error')
        t.is(error.reason, 'New password must be a string!', 'fails with error message')
      })
  }
)

test('cryptoStore.changePassword() should update the check in the salt object', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.store.find('hoodiePluginCryptoStore/salt')
    })

    .then(function (oldSaltDoc) {
      return hoodie.cryptoStore.changePassword('test', 'otherPassword')

        .then(function () {
          return hoodie.store.find('hoodiePluginCryptoStore/salt')
        })

        .then(function (newSaltDoc) {
          t.notEqual(newSaltDoc.check.tag, oldSaltDoc.check.tag, 'tag should not be equal')
          t.notEqual(newSaltDoc.check.data, oldSaltDoc.check.data, 'data should not be equal')
          t.notEqual(newSaltDoc.check.nonce, oldSaltDoc.check.nonce, 'nonce should not be equal')
        })
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.changePassword() should only update objects that it can decrypt', function (t) {
  t.plan(7)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      var adding = hoodie.cryptoStore.add({
        _id: 'shouldUpdate',
        test: 'value'
      })

      var withPassword = hoodie.cryptoStore.withPassword('otherPassword')
        .then(function (result) {
          return result.store.add({
            _id: 'notUpdate',
            value: 'other'
          })
        })

      return Promise.all([adding, withPassword])
    })

    .then(function () {
      return hoodie.cryptoStore.changePassword('test', 'nextPassword')
    })

    .then(function (report) {
      t.is(report.notUpdated.length, 1, 'notUpdated array has a length of 1')
      t.is(report.notUpdated[0], 'notUpdate', 'notUpdated array has the IDs')

      var updated = hoodie.cryptoStore.find('shouldUpdate')

      var notUpdated = hoodie.store.find('notUpdate')

      return Promise.all([updated, notUpdated])
    })

    .then(function (docs) {
      t.is(docs[0]._id, 'shouldUpdate', 'correct id')
      t.ok(/^2-/.test(docs[0]._rev), 'revision is 2')
      t.is(docs[0].test, 'value', 'doc can be decrypted')

      t.is(docs[1]._id, 'notUpdate', 'correct id')
      t.ok(/^1-/.test(docs[1]._rev), 'revision is 1')
    })

    .catch(function (err) {
      t.end(err)
    })
})
