'use strict'

var Promise = require('lie')

var decryptOne = require('./helpers/decrypt-one')
var find = require('./find')
var updateValues = require('./utils/update-values')
var updateObject = require('./utils/update-object')

module.exports = update

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

    .catch(function (err) {
      var parentState = Object.getPrototypeOf(state)
      if (Object.getPrototypeOf(parentState) == null) { // it is root
        throw err
      }

      return find(store, parentState, prefix, objectsOrIds)
    })

    .then(function (oldObjects) {
      return isMany
        ? updateMany(store, key, objectsOrIds, oldObjects, change)
        : updateOne(store, key, objectsOrIds, oldObjects, change)
    })
}

function updateOne (store, key, objectOrId, oldObject, change) {
  return updateObject(objectOrId, oldObject, change, key, false)

    .then(function (updatedObject) {
      return store.update(updatedObject._id, function update (object) {
        updateValues(object, updatedObject)
      })
    })

    .then(function (updated) {
      return decryptOne(key, updated)
    })
}

function updateMany (store, key, objectsOrIds, oldObjects, change) {
  var mapped = oldObjects.map(function (old, index) {
    if (old instanceof Error) return Promise.resolve(old)

    return updateObject(objectsOrIds[index], old, change, key, false)

      .then(function (updated) {
        if (updated instanceof Error) return Promise.resolve(updated)

        return store.update(updated._id, function updater (object) {
          updateValues(object, updated)
        })

          .then(decryptOne.bind(null, key))
      })
  })

  return Promise.all(mapped)
}
