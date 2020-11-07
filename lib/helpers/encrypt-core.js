'use strict'

module.exports = encrypt

var Buffer = require('buffer/').Buffer
var Promise = require('lie')
var subtle = (global.crypto && global.crypto.subtle) ||
  (global.msCrypto && window.msCrypto.subtle) ||
  (global.msrCrypto && window.msrCrypto.subtle) ||
  require('./msrcrypto').subtle

/**
 * Encrypt data.
 * @param {Buffer} key  - Encryption key. This is generated with the users password.
 * @param {Buffer} iv   - Also nonce. Random bytes unique to a doc.
 * @param {Buffer} data - The data that should be encrypted.
 * @param {Buffer} aad  - Additional data. Here always the _id of the doc.
 * @returns {Promise}   - An object with the keys: tag and data. Both are hex strings.
 */
function encrypt (key, iv, data, aad) {
  if (key.length !== 32) {
    return Promise.reject(new TypeError('invalid key size'))
  }

  return subtle.importKey('raw', key, { name: 'AES-GCM' }, true, ['encrypt'])

    .then(function (key) {
      var options = {
        name: 'AES-GCM',
        iv: iv
      }

      if (aad != null) {
        options.additionalData = aad
      }

      return subtle.encrypt(options, key, data)
    })

    .then(function (response) {
      var buffy = Buffer.from(response)

      return {
        tag: buffy.slice(-16).toString('hex'),
        data: buffy.slice(0, -16).toString('hex')
      }
    })

    .catch(function (err) {
      if (err.type === 'error' && err.data instanceof Error) {
        throw err.data
      }
      throw err
    })
}
