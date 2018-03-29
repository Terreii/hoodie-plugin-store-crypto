'use strict'

var Promise = require('lie')

var encryptOne = require('./helpers/encrypt-one')
var decryptOne = require('./helpers/decrypt-one')
var findAll = require('./find-all')

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

  return findAll(store, state, prefix, filter)

    .then(function (docs) {
      var timestamp = new Date().toISOString()

      var encryped = docs.map(function (doc) {
        doc._deleted = true
        doc.hoodie.updatedAt = timestamp
        doc.hoodie.deletedAt = timestamp

        return encryptOne(key, null, doc)
      })

      return Promise.all(encryped)
    })

    .then(function (encryped) {
      return store.db.bulkDocs(encryped)

        .then(function (result) {
          var decryped = result.map(function (oneResult, index) {
            if (!oneResult.ok) return Promise.resolve(oneResult) // error

            var encryptDoc = encryped[index]
            encryptDoc._rev = oneResult.rev
            return decryptOne(key, encryptDoc)
          })

          return Promise.all(decryped)
        })
    })
}
