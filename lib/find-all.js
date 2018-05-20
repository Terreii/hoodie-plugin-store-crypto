'use strict'

var Promise = require('lie')
var isntDesignDoc = require('@hoodie/store-client/lib/utils/isnt-design-doc')

var decryptOne = require('./helpers/decrypt-one')

module.exports = findAll

/**
 * finds all existing objects in local database.
 *
 * @param  {Object}   store      instance of a hoodie client store
 * @param  {Object}   state      crypto config
 * @param  {String}   prefix     optional id prefix
 * @param  {Function} [filter]   Function returning `true` for any object
 *                               to be returned.
 * @return {Promise}
 */
function findAll (store, state, prefix, filter) {
  var key = state.key
  var options = {
    include_docs: true
  }

  if (prefix) {
    options.startkey = prefix
    options.endkey = prefix + '\uffff'
  }

  return store.db.allDocs(options)

    .then(function (res) {
      var objects = res.rows
        .filter(isntDesignDoc)
        .map(function (row) {
          return decryptOne(key, row.doc)

            .catch(function (err) {
              var parentState = Object.getPrototypeOf(state)
              if (Object.getPrototypeOf(parentState) == null) { // it is root
                throw err
              }

              return decryptOne(parentState.key, row.doc)
            })
        })

      var allDecrypted = Promise.all(objects)

      return typeof filter === 'function'
        ? allDecrypted.then(function (objects) {
          return objects.filter(filter)
        })
        : allDecrypted
    })
}
