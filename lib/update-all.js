'use strict'

var Promise = require('lie')

module.exports = updateAll

/**
 * updates all existing docs
 *
 * @param  {Object}          store    instance of a hoodie client store
 * @param  {Object}          state    crypto config
 * @param  {String}          prefix   optional id prefix
 * @param  {Object|Function} change   changed properties or function that
 *                                    alters passed doc
 * @return {Promise}
 */
function updateAll (store, state, prefix, changedProperties) {
  return Promise.resolve({})
}
