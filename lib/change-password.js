'use strict'

var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var createKey = require('./create-key')
var createPasswordCheck = require('./utils/create-password-check')
var isEncryptedObject = require('./utils/is-encrypted-object')
var decryptOne = require('./helpers/decrypt-one')
var encryptMany = require('./helpers/encrypt-many')
var createResetKeys = require('./helpers/create-reset-keys')

module.exports = changePassword

/**
 * Changes the encryption and updates old docs.
 * @param {object} store Instance of the Hoodie-Client-Store.
 * @param {object} state Internal state of hoodie-plugin-crypto-store.
 * @param {string} oldPassword Old password.
 * @param {string} newPassword New password.
 */
function changePassword (store, state, oldPassword, newPassword) {
  if (newPassword == null || typeof newPassword !== 'string' || newPassword.length === 0) {
    return Promise.reject(pouchdbErrors.createError(
      pouchdbErrors.BAD_ARG, 'New password must be a string!'
    ))
  }
  if (newPassword.length < 3) {
    return Promise.reject(pouchdbErrors.createError(
      pouchdbErrors.BAD_ARG, 'password is to short!'
    ))
  }

  return store.find('hoodiePluginCryptoStore/salt')

    .then(function (saltDoc) {
      // check if the old password is the same
      return createKey(oldPassword, saltDoc.salt)

        .then(function (res) {
          if (!res.key.equals(state.key)) {
            throw pouchdbErrors.UNAUTHORIZED
          }
          return res.key
        })
    })

    .then(function (oldKey) {
      var newKey = null
      var newSalt = null

      // create new key and salt
      return createKey(newPassword, null)

        .then(function (res) {
          newKey = res.key
          newSalt = res.salt

          return createResetKeys(store, newKey)
        })

        .then(function (resetKeys) {
          // set new state
          state.key = newKey
          state.salt = newSalt
          return {
            oldKey: oldKey,
            resetKeys: resetKeys,
            newKey: newKey,
            newSalt: newSalt
          }
        })
    })

    .then(function (data) {
      var notDecrypted = [] // will store the ids of docs that couldn't be decrypted/updated

      // update old encrypted docs
      return store.db.allDocs({ include_docs: true })
        .then(function (rows) {
          var docs = rows.rows // update all encrypted docs! _design/* too!
            .map(function (row) {
              return row.doc
            })
          return docs
        })

        .catch(function (err) { // TODO: remove if Store-client with db as getter is published
          if (err.message === 'database is destroyed') {
            return store.findAll()
          }
          throw err
        })

        .then(function (docs) {
          var decrypted = docs
            .filter(function (doc) {
              return isEncryptedObject(doc) && !/^hoodiePluginCryptoStore\/pwReset/.test(doc._id)
            })
            .map(function (doc) {
              return decryptOne(data.oldKey, doc)

                .catch(function (error) {
                  if (error.message === 'Unsupported state or unable to authenticate data') {
                    return doc._id
                  }
                  throw error
                })
            })

          return Promise.all(decrypted)
        })

        .then(function (decrypted) {
          return decrypted.reduce(function (all, doc) {
            if (typeof doc === 'string') {
              all.notDecrypted.push(doc)
            } else {
              all.decrypted.push(doc)
            }
            return all
          }, {
            decrypted: [],
            notDecrypted: []
          })
        })

        .then(function (result) {
          notDecrypted = result.notDecrypted
          return encryptMany(data.newKey, null, result.decrypted)
        })

        .then(function (toUpdate) {
          return createPasswordCheck(data.newKey)

            .then(function (check) {
              toUpdate.push({
                _id: 'hoodiePluginCryptoStore/salt',
                salt: data.newSalt,
                check: check
              })
              return store.update(toUpdate)
            })
        })

        .then(function (updated) {
          return {
            salt: data.newSalt,
            resetKeys: data.resetKeys,
            notUpdated: notDecrypted
          }
        })
    })
}
