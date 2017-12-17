'use strict'

var nativeCrypto = require('native-crypto')

var ignore = require('./ignore.js')

// Mostly copied from https://github.com/calvinmetcalf/crypto-pouch/blob/master/index.js#L157
module.exports = function decryptDoc (key, doc) {
  if (!doc.nonce || !doc._id || !doc.tag || !doc.data) return Promise.resolve(doc)

  var data = Buffer.from(doc.data, 'hex')
  var tag = Buffer.from(doc.tag, 'hex')
  var encryptedData = Buffer.concat([data, tag])

  var nonce = Buffer.from(doc.nonce, 'hex')
  var aad = Buffer.from(doc._id)

  return nativeCrypto.decrypt(key, nonce, encryptedData, aad)

  .then(function (outData) {
    var out = JSON.parse(outData)

    for (var i = 0, len = ignore.length; i < len; i++) {
      var k = ignore[i]
      out[k] = doc[k]
    }

    return out
  })
}
