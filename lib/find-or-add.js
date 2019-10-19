'use strict'

var assign = require('lodash/assign')
var Promise = require('lie')
var PouchDBErrors = require('pouchdb-errors')

var encryptOne = require('./helpers/encrypt-one')
var encryptMany = require('./helpers/encrypt-many')
var decryptOne = require('./helpers/decrypt-one')
var decryptMany = require('./helpers/decrypt-many')
var isEncryptedObject = require('./utils/is-encrypted-object')

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
  var startTime = Date.now()

  if (key == null || key.length < 32) {
    return Promise.reject(PouchDBErrors.UNAUTHORIZED)
  }

  if (typeof idOrObject === 'string') {
    if (properties == null) return Promise.reject(PouchDBErrors.MISSING_ID)

    var toStore = assign({}, properties, {
      _id: idOrObject
    })

    loading = encryptOne(state, prefix, toStore)

      .then(function (encrypted) {
        return store.findOrAdd(encrypted._id, encrypted)
      })
  } else if (Array.isArray(idOrObject)) {
    loading = encryptMany(state, prefix, idOrObject)

      .then(function (objects) {
        return store.findOrAdd(objects)
      })
  } else {
    if (idOrObject._id == null) return Promise.reject(PouchDBErrors.MISSING_ID)

    loading = encryptOne(state, prefix, idOrObject)

      .then(function (object) {
        return store.findOrAdd(object)
      })
  }

  var decrypted = null

  return loading

    .then(function (object) {
      // compatibility: if no password check did exist in saltDoc
      if (typeof state.addPwCheck === 'function') {
        decrypted = Array.isArray(object)
          ? object.reduce(function (indexes, aObj, index) {
            var shouldAdd = !(aObj instanceof Error) &&
              isEncryptedObject(aObj) &&
              new Date(aObj.hoodie.createdAt).getTime() < startTime

            if (shouldAdd) {
              indexes.push(index)
            }
            return indexes
          }, [])
          : isEncryptedObject(object) && new Date(object.hoodie.createdAt).getTime() < startTime
      }

      return Array.isArray(object)
        ? decryptMany(key, object)
        : decryptOne(key, object)
    })

    .then(function (res) {
      // compatibility: if no password check did exist in saltDoc
      if (typeof state.addPwCheck === 'function') {
        var didPass = Array.isArray(res)
          ? decrypted.some(function (index) {
            return !(res[index] instanceof Error)
          })
          : decrypted

        if (didPass) {
          return state.addPwCheck()

            .then(function () {
              return res
            }, function () {
              return res
            })
        }
      }

      // normal
      return res
    })
}
