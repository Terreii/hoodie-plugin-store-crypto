'use strict'

var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var createKey = require('./create-key')
var changePasswordAndUpdateDocs = require('./helpers/change-password-and-update-docs')

module.exports = changePassword

/**
 * Changes the encryption and updates old docs.
 * @param {object} store Instance of the Hoodie-Client-Store.
 * @param {object} state Internal state of hoodie-plugin-crypto-store.
 * @param {string} oldPassword Old password.
 * @param {string} newPassword New password.
 */
function changePassword (store, state, oldPassword, newPassword) {
  if (newPassword == null || typeof newPassword !== 'string' || newPassword.length === 0) {
    return Promise.reject(pouchdbErrors.createError(
      pouchdbErrors.BAD_ARG, 'New password must be a string!'
    ))
  }
  if (newPassword.length < 3) {
    return Promise.reject(pouchdbErrors.createError(
      pouchdbErrors.BAD_ARG, 'password is to short!'
    ))
  }

  return store.find('hoodiePluginCryptoStore/salt')

    .then(function (saltDoc) {
      // check if the old password is the same
      return createKey(oldPassword, saltDoc.salt)

        .then(function (res) {
          if (!res.key.equals(state.key)) {
            throw pouchdbErrors.UNAUTHORIZED
          }
          return res.key
        })
    })

    .then(function (oldKey) {
      return changePasswordAndUpdateDocs(store, state, oldKey, newPassword)
    })
}
