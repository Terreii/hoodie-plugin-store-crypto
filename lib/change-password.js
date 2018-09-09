'use strict'

var Promise = require('lie')

var createKey = require('./create-key')
var isEncryptedObject = require('./utils/is-encrypted-object')
var decryptOne = require('./helpers/decrypt-one')
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
      var notDecrypted = [] // will store the ids of docs that couldn't be decrypted/updated

      // update old encrypted docs
      return store.db.allDocs({include_docs: true})
        .then(function (rows) {
          var docs = rows.rows // update all encryped docs! _design/* too!
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
            .filter(isEncryptedObject)
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
          toUpdate.push({
            _id: '_design/cryptoStore/salt',
            salt: data.newSalt
          })
          return store.update(toUpdate)
        })

        .then(function (updated) {
          return {
            salt: data.newSalt,
            notUpdated: notDecrypted
          }
        })
    })
}
