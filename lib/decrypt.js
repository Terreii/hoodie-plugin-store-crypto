'use strict'

var decrypt = require('native-crypto/decrypt')
var Promise = require('lie')

var ignore = require('./utils/ignore.js')
var isEncryptedObject = require('./utils/is-encrypted-object')

module.exports = decryptDoc

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
      var out = JSON.parse(outData)

      ignore.forEach(function (key) {
        var ignoreValue = doc[key]

        if (ignoreValue !== undefined) {
          out[key] = ignoreValue
        }
      })

      return out
    })
}
