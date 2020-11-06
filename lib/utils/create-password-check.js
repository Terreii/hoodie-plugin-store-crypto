'use strict'

module.exports = createPasswordCheck

var Buffer = require('buffer/').Buffer
var randomBytes = require('randombytes')

var encrypt = require('../helpers/encrypt-core')

/**
 * Will create the password-check of a saltDoc. It is a random string that will be encrypted.
 *
 * @param {String} key crypto-key that is used to encrypt/decrypt docs.
 *
 * @return {Promise}
 */
function createPasswordCheck (key) {
  var nonce = randomBytes(12)
  var aad = Buffer.from('hoodiePluginCryptoStore/salt')
  var passwordTest = randomBytes(64)

  return encrypt(key, nonce, passwordTest, aad)

    .then(function (encrypted) {
      // Return the check object
      encrypted.nonce = nonce.toString('hex')
      return encrypted
    })
}
