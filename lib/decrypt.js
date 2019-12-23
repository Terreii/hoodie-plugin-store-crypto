'use strict'

module.exports = decryptDoc

var aes = require('browserify-aes')
var assign = require('lodash/assign')
var Promise = require('lie')

var isEncryptedObject = require('./utils/is-encrypted-object')

var cryptoKeys = [
  'data',
  'tag',
  'nonce'
]
var subtle = global.crypto && global.crypto.subtle

// Mostly copied from https://github.com/calvinmetcalf/crypto-pouch/blob/master/index.js#L157
function decryptDoc (key, doc) {
  if (!key || key.length !== 32) {
    return Promise.reject(new TypeError('No valid key set! Please unlock the cryptoStore first!'))
  }

  if (!isEncryptedObject(doc)) return Promise.resolve(doc)

  var data = Buffer.from(doc.data, 'hex')
  var tag = Buffer.from(doc.tag, 'hex')

  var nonce = Buffer.from(doc.nonce, 'hex')
  var aad = Buffer.from(doc._id)

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
              iv: nonce,
              additionalData: aad
            }

            var encryptedData = Buffer.concat([data, tag])
            return subtle.decrypt(options, cryptoKey, encryptedData)
          })

          .then(function (result) {
            return Buffer.from(result).toString()
          })
      } else {
        // fall back to browserify-aes
        var cipher = aes.createDecipheriv('aes-256-gcm', key, nonce)
        cipher.setAAD(aad)
        cipher.setAuthTag(tag)

        var output = cipher.update(data)
        cipher.final()
        return output.toString()
      }
    })

    .then(function (outData) {
      var decrypted = JSON.parse(outData)

      var out = assign({}, doc, decrypted)

      cryptoKeys.forEach(function (key) {
        if (out[key] === doc[key]) {
          delete out[key]
        }
      })

      return out
    })
}

var canUseBrowserCrypto = null

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
