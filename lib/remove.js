'use strict'

var Promise = require('lie')

module.exports = remove

/**
 * removes existing object
 *
 * @param  {Object}          store          instance of a hoodie client store
 * @param  {Object}          state          crypto config
 * @param  {String}          prefix         optional id prefix
 * @param  {Object}          objectsOrIds   id or object with `._id` property
 * @param  {Object|Function} [change]       Change properties or function that
 *                                          changes existing object
 * @return {Promise}
 */
function remove (store, state, prefix, objectsOrIds, change) {
  return Promise.resolve({})
}
