'use strict'

var Buffer = require('buffer/').Buffer
var randomBytes = require('randombytes')
var subtle = (global.crypto && global.crypto.subtle) ||
  (global.msCrypto && window.msCrypto.subtle) ||
  (global.msrCrypto && window.msrCrypto.subtle) ||
  require('./helpers/msrcrypto').subtle

module.exports = function createKey (password, saltArg) {
  var passwordBuffer = toBuffer(password, 'utf-8', 'password')
  var digest = 'SHA-256'
  var iterations = 100000
  var keyLength = 256 / 8

  var salt = saltArg != null && typeof saltArg === 'string' && saltArg.length === 32
    ? saltArg
    : randomBytes(16).toString('hex')
  var saltyBuffy = Buffer.from(salt, 'hex')

  return subtle.importKey('raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveBits'])

    .then(function (key) {
      return subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltyBuffy,
          iterations: iterations,
          hash: {
            name: digest
          }
        },
        key,
        keyLength << 3
      )
    })

    .then(function (res) {
      return {
        key: Buffer.from(res),
        salt: salt
      }
    })
}

function toBuffer (thing, encoding, name) {
  if (Buffer.isBuffer(thing)) {
    return thing
  } else if (typeof thing === 'string') {
    return Buffer.from(thing, encoding)
  } else if (ArrayBuffer.isView(thing)) {
    return Buffer.from(thing.buffer)
  } else {
    throw new TypeError(name + ' must be a string, a Buffer, a typed array or a DataView')
  }
}
