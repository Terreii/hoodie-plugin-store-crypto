'use strict'

var test = require('tape')

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
  'cryptoStore.changePassword(oldPassword, newPassword) should resolve with the new salt',
  function (t) {
    t.plan(3)

    var hoodie = createCryptoStore()

    hoodie.cryptoStore.setPassword('test')

      .then(function () {
        return hoodie.cryptoStore.changePassword('test', 'foo')
      })

      .then(function (salt) {
        t.is(typeof salt, 'string', 'salt is a string')
        t.is(salt.length, 32, 'salt has the correct length')

        return hoodie.store.find('_design/cryptoStore/salt')

          .then(function (saltObj) {
            t.is(saltObj.salt, salt, 'stored salt was updated')
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

    hoodie.cryptoStore.setPassword('test')

      .then(function () {
        return hoodie.cryptoStore.add({foo: 'bar'})
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

  hoodie.cryptoStore.setPassword('test')

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

    hoodie.cryptoStore.setPassword('test')

      .then(function () {
        return hoodie.cryptoStore.changePassword('foo', 'bar')
      })

      .then(function () {
        t.fail('should throw an Error')
      })

      .catch(function (error) {
        t.is(error.message, 'old password mismatch', 'fails with error message')
      })
  }
)

test(
  'cryptoStore.changePassword(oldPassword, newPassword) should fail if there is no new password',
  function (t) {
    t.plan(1)

    var hoodie = createCryptoStore()

    hoodie.cryptoStore.setPassword('test')

      .then(function () {
        return hoodie.cryptoStore.changePassword('test')
      })

      .then(function () {
        t.fail('should throw an Error')
      })

      .catch(function (error) {
        t.is(error.message, 'New password must be a string!', 'fails with error message')
      })
  }
)
