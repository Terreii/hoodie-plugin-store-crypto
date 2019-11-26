'use strict'

var pouchdbErrors = require('pouchdb-errors')
var Promise = require('lie')
var decrypt = require('native-crypto/decrypt')

var createKey = require('./create-key')
var createPasswordCheck = require('./utils/create-password-check')

module.exports = unlock

/**
 * Unlocks the cryptoStore with the salt in hoodiePluginCryptoStore/salt
 *
 * @param  {Object}    store        instance of a hoodie client store
 * @param  {Object}    state        crypto config
 * @param  {String}    password     the encryption password
 */
function unlock (store, state, password) {
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
  // if the store is already unlocked
  if (state.key != null && state.key.length > 0) {
    return Promise.reject(pouchdbErrors.createError(
      pouchdbErrors.INVALID_REQUEST, 'store is already unlocked!'
    ))
  }

  // get updated salt docs from remote
  return store.pull(['hoodiePluginCryptoStore/salt'])

    .then(
      function () {
        return store.find(['hoodiePluginCryptoStore/salt'])
      },
      function (error) {
        return store.find(['hoodiePluginCryptoStore/salt'])

          .then(function (result) {
            console.warn("Couldn't pull salt-docs from remote. Using local salt!\nError: " + error)
            return result
          })
      }
    )

    .then(function (objects) {
      if (typeof objects[0].salt === 'string' && !objects[0]._deleted) {
        // if salt doc exists
        return objects[0]
      } else if (
        (typeof objects[0].salt === 'string' && objects[0]._deleted) ||
        objects[0].status === 404
      ) {
        // if no salt doc exists
        throw pouchdbErrors.MISSING_DOC
      } else {
        return objects[0]
      }
    })

    .then(function (saltDoc) {
      var salt = saltDoc.salt

      if (salt == null || typeof salt !== 'string' || salt.length !== 32) {
        throw pouchdbErrors.createError(
          pouchdbErrors.BAD_ARG,
          'salt in "hoodiePluginCryptoStore/salt" must be a 32 char string!'
        )
      }

      return createKey(password, salt)

        .then(function (res) {
          // Add a function that will be called on the first successful read of an encrypted
          // doc. And it will then add the password check to the salt doc.
          if (saltDoc.check == null && !state.noPasswordCheckAutoFix) {
            state.addPwCheck = addPwCheckToSalt.bind(null, state, store)
            return res
          } else if (saltDoc.check == null && state.noPasswordCheckAutoFix) {
            return res
          }

          // check if the encrypted data in check, can be decrypted with this key.
          var data = Buffer.from(saltDoc.check.data, 'hex')
          var tag = Buffer.from(saltDoc.check.tag, 'hex')
          var encryptedData = Buffer.concat([data, tag])

          var nonce = Buffer.from(saltDoc.check.nonce, 'hex')
          var aad = Buffer.from(saltDoc._id)

          return decrypt(res.key, nonce, encryptedData, aad)

            .then(function () {
              return res
            })

            .catch(function (err) {
              // attach PouchDBs UNAUTHORIZED error to the error
              err.status = pouchdbErrors.UNAUTHORIZED.status
              err.name = pouchdbErrors.UNAUTHORIZED.name
              err.reason = pouchdbErrors.UNAUTHORIZED.reason
              err.error = true
              throw err
            })
        })
    })

    .then(function (res) {
      // unlock
      state.key = res.key
      state.salt = res.salt
    })
}

function addPwCheckToSalt (state, store) {
  delete state.addPwCheck // remove itself

  return createPasswordCheck(state.key)

    .then(function (check) {
      return store.update('hoodiePluginCryptoStore/salt', { check: check })
    })
}
