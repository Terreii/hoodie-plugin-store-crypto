'use strict'

var Promise = require('lie')

module.exports = findOrAdd

/**
 * tries to find object in local database, otherwise creates new encrypted one
 * with passed properties.
 *
 * @param  {Object}                 store        instance of a hoodie client store
 * @param  {Object}                 state        crypto config
 * @param  {String}                 prefix       optional id prefix
 * @param  {String|Object|Object[]} idOrObject   id or object with `._id` property
 * @param  {Object}                 [properties] Optional properties if id passed
 *                                               as first option
 * @return {Promise}
 */
function findOrAdd (store, state, prefix, idOrObject, properties) {
  return Promise.resolves({})
}
