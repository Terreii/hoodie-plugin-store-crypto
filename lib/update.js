'use strict'

var Promise = require('lie')
var PouchDBErrors = require('pouchdb-errors')

var encryptOne = require('./helpers/encrypt-one')
var decryptOne = require('./helpers/decrypt-one')
var decryptMany = require('./helpers/decrypt-many')
var find = require('./find')
var ignore = require('./ignore')

module.exports = update

function updateObject (objectOrId, old, change, key) {
  if (objectOrId == null || (typeof objectOrId === 'string' && change == null)) {
    return PouchDBErrors.NOT_AN_OBJECT
  }

  if (old instanceof Error) return old

  var object = typeof objectOrId === 'string'
    ? {_id: objectOrId}
    : objectOrId

  var changed = Object.assign({}, old, object)

  if (typeof change === 'function') {
    change(changed)
  } else {
    Object.assign(changed, change)
  }

  Object.assign(changed, {_id: old._id, _rev: old._rev, hoodie: old.hoodie})

  return encryptOne(key, null, changed)
}

/**
 * updates and encrypts existing object.
 *
 * @param  {Object}                   store         instance of a hoodie client store
 * @param  {Object}                   state         crypto config
 * @param  {String}                   prefix        optional id prefix
 * @param  {String|Object|Object[]}   objectsOrIds  id or object (or array of objects) with `._id` property
 * @param  {Object|Function}          [change]      Changed properties or function
 *                                                  that changes existing object
 * @return {Promise}
 */
function update (store, state, prefix, objectsOrIds, change) {
  var isMany = Array.isArray(objectsOrIds)
  var key = state.key

  return find(store, state, prefix, objectsOrIds)

  .then(function (oldObjects) {
    if (isMany) {
      var all = oldObjects.map(function (old, index) {
        return updateObject(objectsOrIds[index], old, change, key)
      })

      return Promise.all(all)
    } else {
      return updateObject(objectsOrIds, oldObjects, change, key)
    }
  })

  .then(function (objects) {
    // If it is one and there was an Error
    if (objects instanceof Error) return objects

    var ids = isMany
      ? objects.map(function (object) {
        // map Errors to objects without an _id
        // (the errors from store.update will be replaced later)
        if (object instanceof Error) return {}

        return object._id
      })
      : objects._id

    var index = 0
    return store.update(ids, function updater (object) {
      Object.keys(object).forEach(function (key) {
        // Delete everything but ignore keys
        if (!ignore.includes(key)) {
          delete object[key]
        }
      })

      Object.assign(object, isMany ? objects[index] : objects, object)
      index += 1
    })

    .then(function (updated) {
      if (!isMany) {
        return decryptOne(key, updated)
      }

      return decryptMany(key, updated)

      .then(function (decrypted) {
        return decrypted.map(function (object, index) {
          // if there was an Error before, use it
          return object instanceof Error && objects[index] instanceof Error
            ? objects[index]
            : object
        })
      })
    })
  })
}
