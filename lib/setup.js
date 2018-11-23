'use strict'

var pouchdbErrors = require('pouchdb-errors')
var Promise = require('lie')

var createKey = require('./create-key')

module.exports = setup

/**
 * Setup function for first run and generating a key and salt. It dosn't unlock!
 *
 * @param  {Object}    store        instance of a hoodie client store
 * @param  {Object}    state        crypto config
 * @param  {String}    password     the password that should be used for encryption
 * @param  {String}    [salt]       32 char salt, that will be used for encryption
 */
function setup (store, state, password, salt) {
  // check args
  if (typeof password !== 'string' || password.length < 4) {
    return Promise.reject(pouchdbErrors.createError(
      pouchdbErrors.BAD_ARG, 'password mut be a string!'
    ))
  }
  if (salt != null && (typeof salt !== 'string' || salt.length !== 32)) {
    return Promise.reject(pouchdbErrors.createError(
      pouchdbErrors.BAD_ARG, 'salt must be a 32 char string!'
    ))
  }

  return store.find(['hoodiePluginCryptoStore/salt', '_design/cryptoStore/salt'])

    .then(function (obj) {
      // check if a salt doc already exists
      if (
        (obj[0].status !== 404 && !obj[0]._deleted) ||
        (obj[1].status !== 404 && !obj[1]._deleted)
      ) {
        throw pouchdbErrors.UNAUTHORIZED
      }

      return store.pull(['hoodiePluginCryptoStore/salt', '_design/cryptoStore/salt'])

        .catch(function (error) {
          console.warn("Couldn't pull docs from remote. Creating new salt!\nError: " + error)
          return []
        })
    })

    .then(function (obj) {
      // // check if a salt doc already exists on remoteDb
      if (obj.length > 0 && (
        (obj[0].status !== 404 && !obj[0]._deleted) ||
        (obj.length === 2 && obj[1].status !== 404 && !obj[1]._deleted)
      )) {
        throw pouchdbErrors.UNAUTHORIZED
      }

      return salt != null
        ? createKey(password, salt)
        : createKey(password)
    })

    .then(function (result) {
      // save salt
      return store.updateOrAdd({
        _id: 'hoodiePluginCryptoStore/salt',
        salt: result.salt
      })
    })

    .then(function (obj) {
      // if there was an deleted salt doc: undelete it
      if (obj._deleted) {
        obj._deleted = false
        return store.updateOrAdd(obj)
      }
    })

    .then(function () {})
}
