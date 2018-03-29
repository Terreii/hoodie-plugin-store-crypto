'use strict'

var toId = require('@hoodie/store-client/lib/utils/to-id')

var decryptOne = require('./helpers/decrypt-one')
var decryptMany = require('./helpers/decrypt-many')

module.exports = find

function toIdWithPrefix (prefix, objectOrId) {
  var id = toId(objectOrId)

  if (prefix && id.substr(0, prefix.length) !== prefix) {
    id = prefix + id
  }

  return id
}

function addPrefix (prefix, objectOrId) {
  if (prefix == null || objectOrId == null) return objectOrId

  if (typeof objectOrId === 'string') {
    return toIdWithPrefix(prefix, objectOrId)
  }

  return Object.assign({}, objectOrId, {
    _id: toIdWithPrefix(prefix, objectOrId._id)
  })
}

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
