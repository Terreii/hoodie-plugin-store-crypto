'use strict'

var Promise = require('lie')

module.exports = updateOrAdd

/**
 * updates existing object and encryptes, or creates otherwise.
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
  return Promise.resolve({})
}
