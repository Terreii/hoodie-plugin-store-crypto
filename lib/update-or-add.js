'use strict'

var Promise = require('lie')
var PouchDBErrors = require('pouchdb-errors')

var add = require('./add')
var update = require('./update')
var toId = require('./utils/to-id')

module.exports = updateOrAdd

/**
 * updates existing object and encrypts, or creates otherwise.
 *
 * @param  {Object} store             instance of a hoodie client store
 * @param  {Object} state             crypto config
 * @param  {String} prefix            optional id prefix
 * @param  {String|Object|Object[]} - id or object with `._id` property, or
 *                                    array of properties
 * @param  {Object} [properties]      If id passed, properties for new
 *                                    or existing object
 * @return {Promise}
 */
function updateOrAdd (store, state, prefix, idOrObjectOrArray, newObject) {
  if (state.key == null || state.key.length < 32) {
    return Promise.reject(PouchDBErrors.UNAUTHORIZED)
  }

  // One
  if (!Array.isArray(idOrObjectOrArray)) {
    return update(store, state, prefix, idOrObjectOrArray, newObject)

      .catch(function (error) {
        if (error.status !== 404) {
          throw error
        }

        if (newObject) {
          newObject._id = toId(idOrObjectOrArray)
          return add(store, state, prefix, newObject)
        }

        return add(store, state, prefix, idOrObjectOrArray)
      })
  }

  // many
  return update(store, state, prefix, idOrObjectOrArray)

    .then(function (objects) {
      var finishedObjects = objects.map(function (object, index) {
        if (object instanceof Error && object.status !== 404) {
          return object
        }

        if (object instanceof Error) {
          return add(store, state, prefix, idOrObjectOrArray[index])

            .catch(function (error) {
              return error
            })
        }

        return object
      })

      return Promise.all(finishedObjects)
    })
}
