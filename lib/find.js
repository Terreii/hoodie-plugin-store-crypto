'use strict'

var Promise = require('lie')

module.exports = find

/**
 * finds existing object in local database and decrypt it
 *
 * @param  {String}                 prefix        optional id prefix
 * @param  {String|Object|Object[]} objectsOrIds  Id of object or object with
 *                                                `._id` property
 * @return {Promise}
 */
function find (store, state, prefix, objectsOrIds) {
  return Promise.resolves({})
}
