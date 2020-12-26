'use strict'

var assign = require('lodash/assign')
var Promise = require('lie')
var PouchDBErrors = require('pouchdb-errors')

var decryptOne = require('./helpers/decrypt-one')
var decryptMany = require('./helpers/decrypt-many')
var isEncrypedDocument = require('./utils/is-encrypted-object').isEncrypedDocument
var toIdWithPrefix = require('./utils/to-id-with-prefix')

module.exports = find

/**
 * finds existing object in local database and decrypt it
 *
 * @param  {Object}                 store         instance of a hoodie client store
 * @param  {Object}                 state         crypto config
 * @param  {String}                 prefix        optional id prefix
 * @param  {String|Object|Object[]} objectsOrIds  Id of object or object with
 *                                                `._id` property
 * @return {Promise}
 */
function find (store, state, prefix, objectsOrIds) {
  var isMany = Array.isArray(objectsOrIds)
  var key = state.key

  if (key == null || key.length < 32) {
    return Promise.reject(PouchDBErrors.UNAUTHORIZED)
  }

  var prefixed = isMany
    ? objectsOrIds.map(function (objectOrId) {
      return addPrefix(prefix, objectOrId)
    })
    : addPrefix(prefix, objectsOrIds)

  return store.find(prefixed)

    .then(function (res) {
      // compatibility: if no password check did exist in saltDoc
      if (typeof state.addPwCheck === 'function') {
        if (isMany && res.some(isEncrypedDocument)) {
          // find indexes of all encrypted objects
          var encryptedIndexes = res.reduce(function (list, obj, index) {
            if (isEncrypedDocument(obj)) {
              list.push(index)
            }
            return list
          }, [])

          return decryptMany(key, res)

            .then(function (objects) {
              // did some of the encrypted objects get decrypted?
              var someDidDecrypt = encryptedIndexes.some(function (index) {
                var obj = objects[index]
                return !(obj instanceof Error) && !isEncrypedDocument(obj)
              })

              if (someDidDecrypt && typeof state.addPwCheck === 'function') {
                return state.addPwCheck()

                  .then(function () {
                    return objects
                  }, function () {
                    return objects
                  })
              }

              return objects
            })
        } else if (!isMany && isEncrypedDocument(res)) {
          return decryptOne(key, res)

            .then(function (res) {
              if (typeof state.addPwCheck === 'function') {
                return state.addPwCheck()

                  .then(function () {
                    return res
                  }, function () {
                    return res
                  })
              }
              return res
            })
        }
      }

      // normal
      return isMany ? decryptMany(key, res) : decryptOne(key, res)
    })
}

function addPrefix (prefix, objectOrId) {
  if (prefix == null || objectOrId == null) return objectOrId

  if (typeof objectOrId === 'string') {
    return toIdWithPrefix(prefix, objectOrId)
  }

  return assign({}, objectOrId, {
    _id: toIdWithPrefix(prefix, objectOrId._id)
  })
}
