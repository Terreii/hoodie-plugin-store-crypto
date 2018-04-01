'use strict'

var pbkdf2 = require('native-crypto/pbkdf2')
var randomBytes = require('randombytes')

module.exports = function createKey (password, saltArg) {
  var digest = 'sha256'
  var iterations = 100000
  var salt = saltArg != null && typeof saltArg === 'string' && saltArg.length === 32
    ? saltArg
    : randomBytes(16).toString('hex')

  return pbkdf2(password, Buffer.from(salt, 'hex'), iterations, 256 / 8, digest)

    .then(function (key) {
      return {
        key: key,
        salt: salt
      }
    })
}
