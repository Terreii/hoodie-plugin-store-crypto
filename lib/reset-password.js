'use strict'

var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var createKey = require('./create-key')
var decryptOne = require('./helpers/decrypt-one')
var changePasswordAndUpdateDocs = require('./helpers/change-password-and-update-docs')

module.exports = resetPassword

/**
 * Reset the encryption password if the user forgets it.
 * Changes the encryption and updates old docs using a resetKey.
 * @param {object} store Instance of the Hoodie-Store-Client
 * @param {object} state State of this plugin
 * @param {string} resetKey A reset-key. That was generated with setup, changePassword or resetPassword.
 * @param {string} newPassword The new user password.
 * @returns {object} Promise resulting to an object containing: New reset keys, a new salt and not updated docs: {resetKeys: [string], salt: string, notUpdated: [string]}
 */
function resetPassword (store, state, resetKey, newPassword) {
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

  return store.withIdPrefix('hoodiePluginCryptoStore/pwReset').findAll()

    .then(function (resetDocs) {
      return Promise.all(resetDocs.map(function (doc) {
        return createKey(resetKey, doc.salt)

          .then(function (result) {
            return decryptOne(result.key, doc)
          })

          .catch(function (err) {
            return err
          })
      }))
    })

    .then(function (resetDocs) {
      var resetDoc = resetDocs.reduce(function (selected, doc) {
        return selected == null && !(doc instanceof Error)
          ? doc
          : selected
      }, null)

      if (resetDoc == null) {
        throw pouchdbErrors.createError(
          pouchdbErrors.UNAUTHORIZED, 'Reset-key is incorrect.'
        )
      }

      return Buffer.from(resetDoc.key, 'hex')
    })

    .then(function (oldKey) {
      return changePasswordAndUpdateDocs(store, state, oldKey, newPassword)
    })
}
