'use strict'

var encrypt = require('native-crypto/encrypt')
var randomBytes = require('randombytes')
var uuid = require('uuid').v4
var includes = require('lodash/includes')
var Promise = require('lie')

var ignore = require('./utils/ignore.js')

module.exports = encryptDoc

var subtle = global.crypto && global.crypto.subtle

// Mostly copied from https://github.com/calvinmetcalf/crypto-pouch/blob/master/index.js#L130
function encryptDoc (state, doc, prefix) {
  var nonce = randomBytes(12)
  var outDoc = {
    _id: '',
    _rev: null,
    hoodie: null,
    tag: '',
    data: '',
    nonce: nonce.toString('hex')
  }
  var encryptDoc = {}

  var docIgnore = ignore.concat(
    Array.isArray(doc.cy_ignore) ? doc.cy_ignore : [],
    Array.isArray(doc.__cy_ignore) ? doc.__cy_ignore : []
  )

  Object.getOwnPropertyNames(doc).forEach(function (key) {
    if (doc[key] === undefined || key === '__cy_ignore') return

    if ((state.handleSpecialMembers && key.charAt(0) === '_') || includes(docIgnore, key)) {
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
  return checkBrowser()

    .then(function (supportsBrowserCrypto) {
      return encrypt(state.key, nonce, data, Buffer.from(outDoc._id))
    })

    .then(function (response) {
      outDoc.tag = response.slice(-16).toString('hex')
      outDoc.data = response.slice(0, -16).toString('hex')
      return outDoc
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
