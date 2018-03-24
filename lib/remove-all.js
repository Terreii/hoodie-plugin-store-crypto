'use strict'

var Promise = require('lie')

module.exports = removeAll

/**
 * removes all existing docs
 *
 * @param  {Object}   store      instance of a hoodie client store
 * @param  {Object}   state      crypto config
 * @param  {String}   prefix     optional id prefix
 * @param  {Function} [filter]   Function returning `true` for any doc
 *                               to be removed.
 * @return {Promise}
 */
function removeAll (store, state, prefix, filter) {
  return Promise.resolve([])
}
