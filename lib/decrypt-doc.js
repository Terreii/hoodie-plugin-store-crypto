'use strict'

module.exports = decryptDoc

var Buffer = require('buffer/').Buffer
var assign = require('lodash/assign')
var Promise = require('lie')

var decrypt = require('./helpers/decrypt-core')
var isEncryptedObject = require('./utils/is-encrypted-object')

var cryptoKeys = [
  'data',
  'tag',
  'nonce'
]

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

  return decrypt(key, nonce, data, tag, aad)

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
