'use strict'

var Promise = require('lie')

var createKey = require('./create-key')
var isEncryptedObject = require('./utils/is-encrypted-object')
var decryptMany = require('./helpers/decrypt-many')
var encryptMany = require('./helpers/encrypt-many')

module.exports = changePassword

function changePassword (store, state, oldPassword, newPassword) {
  if (newPassword == null || typeof newPassword !== 'string' || newPassword.length === 0) {
    return Promise.reject(new Error('New password must be a string!'))
  }

  return store.find('_design/cryptoStore/salt')

    .then(function (saltDoc) {
      // check if the old password is the same
      return createKey(oldPassword, saltDoc.salt)

        .then(function (res) {
          if (!res.key.equals(state.key)) {
            throw new Error('old password mismatch')
          }
          return res.key
        })
    })

    .then(function (oldKey) {
      // create new key and salt
      return createKey(newPassword, null)

        .then(function (res) {
          // set new state
          state.key = res.key
          state.salt = res.salt
          return {
            oldKey: oldKey,
            newKey: res.key,
            newSalt: res.salt
          }
        })
    })

    .then(function (data) {
      // update old encrypted docs
      return store.db.allDocs({include_docs: true})

        .then(function (docs) {
          var filtered = docs.rows // update all encryped docs! _design/* too!
            .map(function (row) {
              return row.doc
            })
            .filter(isEncryptedObject)

          return decryptMany(data.oldKey, filtered)
        })

        .then(function (decryped) {
          return encryptMany(data.newKey, null, decryped)
        })

        .then(function (toUpdate) {
          toUpdate.push({
            _id: '_design/cryptoStore/salt',
            salt: data.newSalt
          })
          return store.update(toUpdate)
        })

        .then(function (updated) {
          return data.newSalt
        })
    })
}
