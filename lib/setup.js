'use strict'

var pouchdbErrors = require('pouchdb-errors')
var Promise = require('lie')

var createKey = require('./create-key')
var createPasswordCheck = require('./utils/create-password-check')
var pull = require('./utils/pull')
var createResetKeys = require('./helpers/create-reset-keys')

module.exports = setup

/**
 * Setup function for first run and generating a key and salt. It doesn't unlock!
 *
 * @param  {Object}    store        instance of a hoodie client store
 * @param  {Object}    state        crypto config
 * @param  {String}    password     the password that should be used for encryption
 * @param  {String}    [salt]       32 char salt, that will be used for encryption
 */
function setup (store, state, password, salt) {
  // check args
  if (typeof password !== 'string') {
    return Promise.reject(pouchdbErrors.createError(
      pouchdbErrors.BAD_ARG, 'password must be a string!'
    ))
  }
  if (password.length < 3) {
    return Promise.reject(pouchdbErrors.createError(
      pouchdbErrors.BAD_ARG, 'password is to short!'
    ))
  }
  if (salt != null && (typeof salt !== 'string' || salt.length !== 32)) {
    return Promise.reject(pouchdbErrors.createError(
      pouchdbErrors.BAD_ARG, 'salt must be a 32 char string!'
    ))
  }

  return store.find(['hoodiePluginCryptoStore/salt'])

    .then(function (obj) {
      // check if a salt doc already exists
      if (obj[0].status !== 404 && !obj[0]._deleted) {
        throw pouchdbErrors.createError(pouchdbErrors.UNAUTHORIZED, 'salt doc already exist!')
      }

      if ('pull' in store) {
        return store.pull(['hoodiePluginCryptoStore/salt'])

          .catch(function () {
            return []
          })
      }

      if ('db' in store && state.remote != null) {
        return pull(['hoodiePluginCryptoStore/salt'], store.db, state.remote)

          .catch(function (err) {
            if (err.status === pouchdbErrors.UNAUTHORIZED.status) {
              console.warn('Could not check the existence of a salt document on a remote db.')
              return []
            }
            if (err.status === 404) {
              return [err]
            }
            throw err
          })
      }
      return []
    })

    .then(function (obj) {
      // check if a salt doc already exists on remoteDb
      if (obj.length > 0 && (obj[0].status !== 404 && !obj[0]._deleted)) {
        throw pouchdbErrors.createError(
          pouchdbErrors.UNAUTHORIZED,
          'salt doc already exist on the remote DB!'
        )
      }

      return salt != null
        ? createKey(password, salt)
        : createKey(password)
    })

    .then(function (result) {
      var saltDoc = createPasswordCheck(result.key)

        .then(function (check) {
          // save salt
          return store.updateOrAdd({
            _id: 'hoodiePluginCryptoStore/salt',
            salt: result.salt,
            check: check
          })
        })

      var resetKeys = createResetKeys(store, result.key)

      return Promise.all([saltDoc, resetKeys])
    })

    .then(function (objs) {
      var obj = objs[0]
      var resetKeys = objs[1]

      // if there was an deleted salt doc: un-delete it
      if (obj._deleted) {
        obj._deleted = false
        return store.updateOrAdd(obj)

          .then(function () {
            return resetKeys
          })
      }

      return resetKeys
    })
}
