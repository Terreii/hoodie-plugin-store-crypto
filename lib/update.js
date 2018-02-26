'use strict'

var Promise = require('lie')

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
  return Promise.resolve({})
}
