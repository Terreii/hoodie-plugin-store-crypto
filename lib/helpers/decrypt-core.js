'use strict'

module.exports = decrypt

var aes = require('browserify-aes')

var subtle = global.crypto && global.crypto.subtle

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

  return checkBrowser()

    // Original implementation from:
    // https://github.com/calvinmetcalf/native-crypto/blob/master/browser/decrypt.js
    .then(function (supportsBrowserCrypto) {
      // for when the browser supports crypto.subtle
      if (supportsBrowserCrypto) {
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
      } else {
        // fall back to browserify-aes
        var cipher = aes.createDecipheriv('aes-256-gcm', key, iv)
        if (aad != null) {
          cipher.setAAD(aad)
        }
        cipher.setAuthTag(tag)

        var output = cipher.update(data)
        cipher.final()
        return output.toString()
      }
    })
}

var canUseBrowserCrypto = null

/**
 * This checks if the browser supports crypto.subtle and the used encryption algorithm.
 */
function checkBrowser () {
  if (global.process && !global.process.browser) {
    return Promise.resolve(false)
  }
  if (!subtle || !subtle.importKey || !subtle.encrypt) {
    return Promise.resolve(false)
  }
  if (canUseBrowserCrypto != null) {
    return Promise.resolve(canUseBrowserCrypto)
  }

  var zeroBuffy = Buffer.alloc(16, 0)

  return subtle.importKey('raw', zeroBuffy, { name: 'AES-GCM' }, true, ['decrypt'])

    .then(function (key) {
      return subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: zeroBuffy.slice(0, 12),
          additionalData: zeroBuffy.slice(0, 8)
        },
        key,
        Buffer.from(
          'A4jazmC2o5LzKMK5cbL+ePeVqqtJS1kj9/2J/5SLweAgAhEhTnOU2iCJtqzQk6vgyU2iGRG' +
            'OKX17fry8ycOI8p7MWbwdPpusE+GvoYsO2TE=',
          'base64'
        )
      )
    })

    .then(function (result) {
      canUseBrowserCrypto = Buffer.from(result).toString('base64') ===
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='

      return canUseBrowserCrypto
    })

    .catch(function () {
      canUseBrowserCrypto = false
      return canUseBrowserCrypto
    })
}
