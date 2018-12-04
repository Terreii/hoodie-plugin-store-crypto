'use strict'

var nativeCrypto = require('native-crypto')
var randomBytes = require('randombytes')

module.exports = createPasswordCheck

/**
 * Will create the password-check of a saltDoc. It is a random string that will be encrypted.
 *
 * @param  {String}     key     crypto-key that is used to encrypt/decrypt docs.
 *
 * @return {Promise}
 */
function createPasswordCheck (key) {
  var nonce = randomBytes(12)
  var aad = Buffer.from('hoodiePluginCryptoStore/salt')
  var passwordTest = randomBytes(64).toString('hex')

  return nativeCrypto.encrypt(key, nonce, passwordTest, aad)

    .then(function (encrypted) {
      // Return the check object
      return {
        nonce: nonce.toString('hex'),
        tag: encrypted.slice(-16).toString('hex'),
        data: encrypted.slice(0, -16).toString('hex')
      }
    })
}
