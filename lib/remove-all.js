'use strict'

var Promise = require('lie')
var PouchDBErrors = require('pouchdb-errors')
var addTimestamps = require('@hoodie/store-client/lib/utils/add-timestamps')

var encryptOne = require('./helpers/encrypt-one')
var decryptOne = require('./helpers/decrypt-one')
var findAll = require('./find-all')
var remove = require('./remove')
var docLock = require('./utils/doc-lock')

module.exports = removeAll

/**
 * removes all existing docs
 *
 * @param  {Object}   store      instance of a hoodie client store
 * @param  {Object}   state      crypto config
 * @param  {String}   prefix     optional id prefix
 * @param  {Function} [filter]   Function returning `true` for any doc
 *                               to be removed.
 * @return {Promise}
 */
function removeAll (store, state, prefix, filter) {
  var key = state.key
  var locked = null

  if (key == null || key.length < 32) {
    return Promise.reject(PouchDBErrors.UNAUTHORIZED)
  }

  return findAll(store, state, prefix, filter)

    .then(function (docs) {
      locked = docLock(docs)

      var encrypted = docs.map(function (doc) {
        doc._deleted = true
        addTimestamps(doc)

        return encryptOne(key, null, doc)
      })

      return Promise.all(encrypted)
    })

    .then(function (encrypted) {
      return store.db.bulkDocs(encrypted)

        .then(function (result) {
          var decrypted = result.map(function (oneResult, index) {
            if (!oneResult.ok) return oneResult // error

            var encryptDoc = encrypted[index]
            encryptDoc._rev = oneResult.rev
            return decryptOne(key, encryptDoc)
          })

          return Promise.all(decrypted)
        })

        .then(function (results) {
          locked.unlock()
          return results
        })

        .catch(function (error) {
          locked.unlock()

          if (error.message === 'database is destroyed') { // workaround for #42
            var deleted = encrypted.map(function (doc) {
              return remove(store, state, prefix, doc._id)

                .catch(function (error) {
                  return error
                })
            })

            return Promise.all(deleted)
          }

          throw error
        })
    })
}
