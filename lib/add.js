'use strict'

var encryptOne = require('./helpers/encrypt-one')
var encryptMany = require('./helpers/encrypt-many')
var decryptOne = require('./helpers/decrypt-one')
var decryptMany = require('./helpers/decrypt-many')

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
  var isMany = Array.isArray(properties)
  var key = state.key

  var encrypted = isMany
    ? encryptMany(key, prefix, properties)
    : encryptOne(key, prefix, properties)

  return encrypted

  .then(function (encryptedDoc) {
    return store.add(encryptedDoc)
  })

  .then(function (res) {
    return isMany ? decryptMany(key, res) : decryptOne(key, res)
  })
}
