'use strict'

var pbkdf2 = require('pbkdf2')
var Promise = require('lie')
var randomBytes = require('randombytes')

module.exports = function createKey (password, saltArg) {
  var digest = 'sha256'
  var iterations = 100000
  var salt = saltArg != null && typeof saltArg === 'string' && saltArg.length === 32
    ? saltArg
    : randomBytes(16).toString('hex')

  return new Promise(function (resolve, reject) {
    var saltyBuffy = Buffer.from(salt, 'hex')

    pbkdf2.pbkdf2(password, saltyBuffy, iterations, 256 / 8, digest, function (err, key) {
      if (err) {
        reject(err)
      } else {
        resolve({
          key: key,
          salt: salt
        })
      }
    })
  })
}
