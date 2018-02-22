'use strict'

var decryptOne = require('./helpers/decrypt-one')
var decryptMany = require('./helpers/decrypt-many')

module.exports = find

function addPrefix (prefix, objectOrId) {
  if (prefix == null || objectOrId == null) return objectOrId

  if (typeof objectsOrIds === 'string') {
    return prefix + objectOrId
  }

  return Object.assign({}, objectOrId, {
    _id: prefix + objectOrId
  })
}

/**
 * finds existing object in local database and decrypt it
 *
 * @param  {String}                 prefix        optional id prefix
 * @param  {String|Object|Object[]} objectsOrIds  Id of object or object with
 *                                                `._id` property
 * @return {Promise}
 */
function find (store, state, prefix, objectsOrIds) {
  var isMany = Array.isArray(objectsOrIds)
  var key = state.key

  var prefixed = isMany
    ? objectsOrIds.map(function (objectOrId) {
      return addPrefix(prefix, objectOrId)
    })
    : addPrefix(prefix, objectsOrIds)

  return store.find(prefixed)

  .then(function (res) {
    return isMany ? decryptMany(key, res) : decryptOne(key, res)
  })
}
