'use strict'

module.exports = decrypt

var Buffer = require('buffer/').Buffer
var getCrypto = require('../utils/get-web-crypto')

/**
 * Decrypt data.
 * @param {Buffer} key  - Encryption key. This is generated with the users password.
 * @param {Buffer} iv   - Also nonce. Random bytes unique to a doc.
 * @param {Buffer} data - The encrypted data.
 * @param {Buffer} tag  - Part of the encrypted data.
 * @param {Buffer} aad  - Additional data. Here always the _id of the doc.
 * @returns {Promise}   - With the Result being a string.
 */
function decrypt (key, iv, data, tag, aad) {
  if (key.length !== 32) {
    return Promise.reject(new TypeError('invalid key size'))
  }
  var subtle = getCrypto().subtle

  return subtle.importKey('raw', key, { name: 'AES-GCM' }, true, ['decrypt'])

    .then(function (cryptoKey) {
      var options = {
        name: 'AES-GCM',
        iv: iv
      }

      if (aad != null) {
        options.additionalData = aad
      }

      var encryptedData = Buffer.concat([data, tag])
      return subtle.decrypt(options, cryptoKey, encryptedData)
    })

    .then(function (result) {
      return Buffer.from(result).toString()
    })

    .catch(function (err) {
      if (err.type === 'error' && err.data instanceof Error) {
        throw err.data
      }
      throw err
    })
}
