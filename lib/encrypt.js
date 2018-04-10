'use strict'

var nativeCrypto = require('native-crypto')
var randomBytes = require('randombytes')
var uuid = require('uuid').v4

var ignore = require('./utils/ignore.js')

module.exports = encryptDoc

// Mostly copied from https://github.com/calvinmetcalf/crypto-pouch/blob/master/index.js#L130
function encryptDoc (key, doc, prefix) {
  var nonce = randomBytes(12)
  var outDoc = {
    nonce: nonce.toString('hex')
  }

  ignore.forEach(function (key) {
    outDoc[key] = doc[key]
    delete doc[key]
  })

  if (!outDoc._id) {
    outDoc._id = uuid()
  }
  if (prefix) {
    outDoc._id = prefix + outDoc._id
  }

  // Encrypting attachments is complicated
  // https://github.com/calvinmetcalf/crypto-pouch/pull/18#issuecomment-186402231
  if (doc._attachments) {
    throw new Error('Attachments cannot be encrypted. Use {ignore: "_attachments"} option')
  }

  var data = JSON.stringify(doc)
  return nativeCrypto.encrypt(key, nonce, data, Buffer.from(outDoc._id))

    .then(function (response) {
      outDoc.tag = response.slice(-16).toString('hex')
      outDoc.data = response.slice(0, -16).toString('hex')
      return outDoc
    })
}
