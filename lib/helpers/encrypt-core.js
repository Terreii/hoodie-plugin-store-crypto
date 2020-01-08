'use strict'

module.exports = encrypt

var aes = require('browserify-aes')
var Promise = require('lie')

var subtle = global.crypto && global.crypto.subtle

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

  return checkBrowser()

    // Original implementation from:
    // https://github.com/calvinmetcalf/native-crypto/blob/master/browser/encrypt.js
    .then(function (supportsBrowserCrypto) {
      // for when the browser supports crypto.subtle
      if (supportsBrowserCrypto) {
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
      } else {
        // fall back to browserify-aes
        var cipher = aes.createCipheriv('aes-256-gcm', key, iv)
        if (aad != null) {
          cipher.setAAD(aad)
        }

        var output = cipher.update(data)
        cipher.final()
        var tag = cipher.getAuthTag()

        return {
          tag: tag.toString('hex'),
          data: output.toString('hex')
        }
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

  var zeroBuffy = Buffer.alloc(32, 0)
  var ivFaith = Buffer.alloc(12, 0)

  return subtle.importKey('raw', zeroBuffy.buffer, { name: 'AES-GCM' }, true, ['encrypt'])

    .then(function (key) {
      return subtle.encrypt(
        { name: 'AES-GCM', iv: ivFaith },
        key,
        zeroBuffy.buffer
      )
    })

    .then(function (res) {
      canUseBrowserCrypto = Buffer.from(res)
        .toString('base64') === 'zqdAPU1ga24HTsXTuvOdGHJgA8o3pip00aL1jnUGNY7R0whMmaqKn9q7PoPrKMFd'

      return canUseBrowserCrypto
    })

    .catch(function () {
      canUseBrowserCrypto = false
      return canUseBrowserCrypto
    })
}
