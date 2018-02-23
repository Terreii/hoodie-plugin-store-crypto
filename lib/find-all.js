'use strict'

var Promise = require('lie')

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
      .filter(function (row) { // Checks for a design doc
        return /^_design/.test(row.id) !== true
      })
      .map(function (row) {
        return decryptOne(key, row.doc)
      })

    var allDecrypted = Promise.all(objects)

    return typeof filter === 'function'
      ? allDecrypted.then(function (objects) {
        return objects.filter(filter)
      })
      : allDecrypted
  })
}
