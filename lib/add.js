'use strict'

var encryptOne = require('./helpers/encrypt-one')
var encryptMany = require('./helpers/encrypt-many')

module.exports = add

/**
 * adds one or multiple objects encrypted to local database
 *
 * @param  {Object}          store        instance of a hoodie client store
 * @param  {Object}          state        crypto config
 * @param  {String}          prefix       optional id prefix
 * @param  {Object|Object[]} properties   Properties of one or
 *                                        multiple objects
 * @return {Promise}
 */
function add (store, state, prefix, properties) {
  var encrypted = Array.isArray(properties)
    ? encryptMany(state.key, prefix, properties)
    : encryptOne(state.key, prefix, properties)

  return encrypted

  .then(function (encryptedDoc) {
    return store.add(encryptedDoc)
  })
}
