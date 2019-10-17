'use strict'

var decrypt = require('native-crypto/decrypt')
var Promise = require('lie')
var assign = require('lodash/assign')

var isEncryptedObject = require('./utils/is-encrypted-object')

module.exports = decryptDoc

var cryptoKeys = [
  'data',
  'tag',
  'nonce'
]

// Mostly copied from https://github.com/calvinmetcalf/crypto-pouch/blob/master/index.js#L157
function decryptDoc (key, doc) {
  if (!isEncryptedObject(doc)) return Promise.resolve(doc)

  var data = Buffer.from(doc.data, 'hex')
  var tag = Buffer.from(doc.tag, 'hex')
  var encryptedData = Buffer.concat([data, tag])

  var nonce = Buffer.from(doc.nonce, 'hex')
  var aad = Buffer.from(doc._id)

  return decrypt(key, nonce, encryptedData, aad)

    .then(function (outData) {
      var decrypted = JSON.parse(outData)

      var out = assign({}, doc, decrypted)

      cryptoKeys.forEach(function (key) {
        delete out[key]
      })

      return out
    })
}
