'use strict'

var test = require('tape')
var Promise = require('lie')
var randomBytes = require('randombytes')
var pouchDbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')
var createKey = require('../../lib/create-key')
var decrypt = require('../../lib/decrypt')

test('resetPassword() should exist on the cryptoStores main API', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  t.equal(typeof hoodie.cryptoStore.resetPassword, 'function', 'resetPassword exists')

  t.equal(
    hoodie.cryptoStore.withIdPrefix('test').resetPassword,
    undefined,
    'withIdPrefix does not have resetPassword'
  )

  hoodie.cryptoStore.withPassword('test')

    .then(function (result) {
      t.equal(result.store.resetPassword, undefined, 'withPassword does not have resetPassword')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test(
  'cryptoStore.resetPassword(resetKey, newPassword) results with new reset keys, salt and not' +
    ' updated docs',
  function (t) {
    t.plan(10)

    var hoodie = createCryptoStore()
    var oldSalt = ''
    var resetKeys = []

    hoodie.cryptoStore.setup('test')

      .then(function (resetKeysResult) {
        resetKeys = resetKeysResult

        return hoodie.cryptoStore.unlock('test')
      })

      .then(function () {
        var doc = hoodie.cryptoStore.add({ value: 42 })

        var docWithOtherPassword = hoodie.cryptoStore.withPassword('otherPassword')

          .then(function (result) {
            return result.store.add({
              _id: 'doNotUpdate',
              value: 'secret'
            })
          })

        return Promise.all([doc, docWithOtherPassword])
      })

      .then(function () {
        return hoodie.store.find('hoodiePluginCryptoStore/salt')

          .then(function (saltDoc) {
            oldSalt = saltDoc.salt
          })
      })

      .then(function () {
        hoodie.cryptoStore.lock()

        var resetKey = getRandomItemOfArray(resetKeys)

        return hoodie.cryptoStore.resetPassword(resetKey, 'newPassword')
      })

      .then(function (report) {
        // new salt
        t.is(typeof report.salt, 'string', 'salt is a string')
        t.is(report.salt.length, 32, 'salt has the correct length')

        // notUpdated Array
        t.ok(Array.isArray(report.notUpdated), 'has a array of not updated IDs')
        t.is(report.notUpdated.length, 1, 'array has a length of 0')
        t.is(report.notUpdated[0], 'doNotUpdate', 'doNotUpdate doc was not updated')

        // new reset keys
        t.is(report.resetKeys.length, 10, 'results with reset keys')

        t.ok(report.resetKeys.every(function (key) {
          return typeof key === 'string' && key.length === 32
        }), 'every key has a length of 32')

        t.ok(report.resetKeys.every(function (key) {
          return resetKeys.indexOf(key) === -1
        }), 'every resetKey is new')

        return hoodie.store.find('hoodiePluginCryptoStore/salt')

          .then(function (saltObj) {
            t.is(saltObj.salt, report.salt, 'stored salt was updated')
            t.notEqual(report.salt, oldSalt, 'new salt is not the old salt')
          })
      })

      .catch(function (err) {
        t.end(err)
      })
  }
)

test('cryptoStore.resetPassword(resetKey, newPassword) changes the encryption', function (t) {
  t.plan(7)

  var hoodie = createCryptoStore()
  var resetKeys = []
  var oldKey = null
  var newKey = null

  hoodie.cryptoStore.setup('test')

    .then(function (newResetKeys) {
      resetKeys = newResetKeys

      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.store.find('hoodiePluginCryptoStore/salt')

        .then(function (saltDoc) {
          return createKey('test', saltDoc.salt)
        })

        .then(function (key) {
          oldKey = key
        })
    })

    .then(function () {
      var unencrypted = hoodie.store.add({
        _id: 'unencrypted',
        value: 42
      })

      var encrypted = hoodie.cryptoStore.add({
        _id: 'encrypted',
        value: 'secret'
      })

      return Promise.all([unencrypted, encrypted])
    })

    .then(function () {
      hoodie.cryptoStore.lock()

      var resetKey = getRandomItemOfArray(resetKeys)

      return hoodie.cryptoStore.resetPassword(resetKey, 'nextPassword')
    })

    .then(function (result) {
      return hoodie.store.find('hoodiePluginCryptoStore/salt')

        .then(function (saltDoc) {
          t.ok(/^2-/.test(saltDoc._rev), 'salt doc was updated')

          return createKey('nextPassword', saltDoc.salt)
        })

        .then(function (key) {
          newKey = key.key
        })
    })

    .then(function () {
      return hoodie.cryptoStore.find('encrypted')
    })

    .then(function (doc) {
      t.equal(doc.value, 'secret', 'encrypted doc was decrypted by hoodie.cryptoStore.find')
      t.ok(/^2-/.test(doc._rev), 'encrypted doc was updated')

      return hoodie.store.find(['unencrypted', 'encrypted'])
    })

    .then(function (updatedDocs) {
      t.ok(/^1-/.test(updatedDocs[0]._rev), 'unencrypted doc was not updated')
      t.equal(updatedDocs[0].value, 42, 'unencrypted doc is not encrypted')

      var oldEncryption = decrypt(oldKey, updatedDocs[1])

        .then(
          function () {
            t.fail('encryption of the encrypted doc was not updated! It was decrypted by old key!')
          },
          function (err) {
            t.ok(err, 'Old encryption did error')
          }
        )

      var newEncryption = decrypt(newKey, updatedDocs[1])

        .then(function (doc) {
          t.equal(doc.value, 'secret', 'encrypted doc was decrypted with new key')
        })

      return Promise.all([oldEncryption, newEncryption])
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.resetPassword() fails if the reset key is not valid', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function (resetKeys) {
      var resetKey = null

      do {
        resetKey = randomBytes(16).toString('hex')
      } while (resetKeys.indexOf(resetKey) !== -1)

      return hoodie.cryptoStore.resetPassword(resetKey, 'otherPassword')
    })

    .then(
      function () {
        t.fail('resetPassword should have failed.')
      },
      function (err) {
        t.equal(err.status, pouchDbErrors.UNAUTHORIZED.status, 'fails with unauthorized')
        t.equal(err.reason, 'Reset-key is incorrect.', 'Fails with custom reason')
      }
    )
})

test('cryptoStore.resetPassword() fails if no new password was passed', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()
  var resetKey = null

  hoodie.cryptoStore.setup('test')

    .then(function (resetKeys) {
      resetKey = getRandomItemOfArray(resetKeys)

      return hoodie.cryptoStore.resetPassword(resetKey)
    })

    .then(
      function () {
        t.fail('resetPassword should have failed.')
      },
      function (err) {
        t.equal(err.status, pouchDbErrors.BAD_ARG.status, 'fails with bar args')
        t.equal(err.reason, 'New password must be a string!', 'Fails with custom reason')
      }
    )

    .then(function () {
      return hoodie.cryptoStore.resetPassword(resetKey, 'a')
    })

    .then(
      function () {
        t.fail('resetPassword should have failed.')
      },
      function (err) {
        t.equal(err.status, pouchDbErrors.BAD_ARG.status, 'fails with bar args')
        t.equal(err.reason, 'password is to short!', 'Fails with custom reason')
      }
    )
})

test(
  'cryptoStore.resetPassword(resetKey, newPassword) should fail if the new password is to short',
  function (t) {
    t.plan(2)

    var hoodie = createCryptoStore()

    hoodie.cryptoStore.setup('test')

      .then(function (resetKeys) {
        var resetKey = getRandomItemOfArray(resetKeys)

        return hoodie.cryptoStore.resetPassword(resetKey, 'a')
      })

      .then(function () {
        t.fail('should throw an Error')
      })

      .catch(function (error) {
        t.is(error.reason, 'password is to short!', 'fails with error message')
        t.is(error.status, pouchDbErrors.BAD_ARG.status, 'fails with a PouchDB error')
      })
  }
)

test(
  'cryptoStore.resetPassword(resetKey, newPassword) should update the check in the salt object', function (t) {
    t.plan(3)

    var hoodie = createCryptoStore()
    var resetKeys = []

    hoodie.cryptoStore.setup('test')

      .then(function (resetKeysResult) {
        resetKeys = resetKeysResult

        return hoodie.store.find('hoodiePluginCryptoStore/salt')
      })

      .then(function (oldSaltDoc) {
        var resetKey = getRandomItemOfArray(resetKeys)

        return hoodie.cryptoStore.resetPassword(resetKey, 'otherPassword')

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
  }
)

test('cryptoStore.resetPassword(resetKey, newPassword) should update reset docs', function (t) {
  t.plan(16)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function (resetKeys) {
      var resetKey = getRandomItemOfArray(resetKeys)

      return hoodie.cryptoStore.resetPassword(resetKey, 'otherPassword')
    })

    .then(function (result) {
      return hoodie.store.withIdPrefix('hoodiePluginCryptoStore/pwReset').findAll()

        .then(function (docs) {
          return {
            keys: result.resetKeys,
            docs: docs
          }
        })
    })

    .then(function (result) {
      var docs = result.docs
      var keys = result.keys

      t.ok(docs.every(function (doc, index) {
        return doc._id === 'hoodiePluginCryptoStore/pwReset_' + index
      }), 'have correct _id\'s')

      t.ok(docs.every(function (doc) {
        return /^2-/.test(doc._rev)
      }), 'reset docs were updated')

      t.ok(docs.every(function (doc) {
        return doc.salt.length === 32
      }), 'have correct salt lengths')

      t.ok(docs.every(function (doc) {
        return doc.tag.length === 32
      }), 'have a tag part with a length of 32')

      t.ok(docs.every(function (doc) {
        return doc.data.length > 0
      }), 'should have encrypted data')

      t.ok(docs.every(function (doc) {
        return doc.nonce.length === 24
      }), 'should have nonce with a length of 24')

      return Promise.all(docs.map(function (doc, index) {
        return createKey(keys[index], doc.salt)

          .then(function (keyObj) {
            return decrypt(keyObj.key, doc)
          })
      }))
    })

    .then(function (decrypted) {
      return hoodie.store.find('hoodiePluginCryptoStore/salt')

        .then(function (saltDoc) {
          return createKey('otherPassword', saltDoc.salt)
        })

        .then(function (keyObj) {
          var key = keyObj.key.toString('hex')

          decrypted.forEach(function (resetDoc) {
            t.equal(resetDoc.key, key, 'encrypted data is equal to key')
          })
        })
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.resetPassword() should only update objects that it can decrypt', function (t) {
  t.plan(7)

  var hoodie = createCryptoStore()
  var resetKeys = []

  hoodie.cryptoStore.setup('test')

    .then(function (resetKeysResult) {
      resetKeys = resetKeysResult

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
      var resetKey = getRandomItemOfArray(resetKeys)

      return hoodie.cryptoStore.resetPassword(resetKey, 'nextPassword')
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

// Utils

function getRandomItemOfArray (array) {
  var index = Math.floor(array.length * Math.random())

  return array[index]
}
