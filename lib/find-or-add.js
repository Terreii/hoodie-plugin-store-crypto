'use strict'

var Promise = require('lie')
var PouchDBErrors = require('pouchdb-errors')

var encryptOne = require('./helpers/encrypt-one')
var encryptMany = require('./helpers/encrypt-many')
var decryptOne = require('./helpers/decrypt-one')
var decryptMany = require('./helpers/decrypt-many')

module.exports = findOrAdd

/**
 * tries to find object in local database, otherwise creates new encrypted one
 * with passed properties.
 *
 * @param  {Object}                 store        instance of a hoodie client store
 * @param  {Object}                 state        crypto config
 * @param  {String}                 prefix       optional id prefix
 * @param  {String|Object|Object[]} idOrObject   id or object with `._id` property
 * @param  {Object}                 [properties] Optional properties if id passed
 *                                               as first option
 * @return {Promise}
 */
function findOrAdd (store, state, prefix, idOrObject, properties) {
  var loading
  var key = state.key

  if (typeof idOrObject === 'string') {
    if (properties == null) return Promise.reject(PouchDBErrors.MISSING_ID)

    var toStore = Object.assign({}, properties, {
      _id: idOrObject
    })

    loading = encryptOne(key, prefix, toStore)

      .then(function (encrypted) {
        return store.findOrAdd(encrypted._id, encrypted)
      })
  } else if (Array.isArray(idOrObject)) {
    loading = encryptMany(key, prefix, idOrObject)

      .then(function (objects) {
        return store.findOrAdd(objects)
      })
  } else {
    if (idOrObject._id == null) return Promise.reject(PouchDBErrors.MISSING_ID)

    loading = encryptOne(key, prefix, idOrObject)

      .then(function (object) {
        return store.findOrAdd(object)
      })
  }

  return loading

    .then(function (object) {
      return Array.isArray(object)
        ? decryptMany(key, object)
        : decryptOne(key, object)
    })
}
