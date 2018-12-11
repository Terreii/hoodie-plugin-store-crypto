'use strict'

var encrypt = require('native-crypto/encrypt')
var randomBytes = require('randombytes')
var uuid = require('uuid').v4
var keys = require('lodash/keys')
var includes = require('lodash/includes')

var ignore = require('./utils/ignore.js')

module.exports = encryptDoc

// Mostly copied from https://github.com/calvinmetcalf/crypto-pouch/blob/master/index.js#L130
function encryptDoc (key, doc, prefix) {
  var nonce = randomBytes(12)
  var outDoc = {
    _id: '',
    _rev: '',
    hoodie: null,
    tag: '',
    data: '',
    nonce: nonce.toString('hex')
  }
  var encryptDoc = {}

  keys(doc).forEach(function (key) {
    if (doc[key] === undefined) return

    if (includes(ignore, key)) {
      outDoc[key] = doc[key]
    } else {
      encryptDoc[key] = doc[key]
    }
  })

  if (!outDoc._id) {
    outDoc._id = uuid()
  }
  if (prefix) {
    outDoc._id = prefix + outDoc._id
  }

  var data = JSON.stringify(encryptDoc)
  return encrypt(key, nonce, data, Buffer.from(outDoc._id))

    .then(function (response) {
      outDoc.tag = response.slice(-16).toString('hex')
      outDoc.data = response.slice(0, -16).toString('hex')
      return outDoc
    })
}
