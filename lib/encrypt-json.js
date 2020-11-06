'use strict'

module.exports = encrypt

var Buffer = require('buffer/').Buffer
var randomBytes = require('randombytes')
var PouchDBErrors = require('pouchdb-errors')
var Promise = require('lie')

var encryptCore = require('./helpers/encrypt-core')

/**
 * Encrypt any JSON data.
 * @param {Object} state crypto config
 * @param {any}    data  JSON data that should be encrypted.
 * @param {string} [aad] Additional data. To validate the encrypted data.
 */
function encrypt (state, data, aad) {
  var key = state.key
  if (key == null || key.length < 32) {
    return Promise.reject(PouchDBErrors.UNAUTHORIZED)
  }

  if (data === undefined) {
    data = null
  }

  var nonce = randomBytes(12)
  var additionalData = aad ? Buffer.from(aad) : undefined
  var buffy = Buffer.from(JSON.stringify(data))

  return encryptCore(key, nonce, buffy, additionalData)

    .then(function (result) {
      result.nonce = nonce.toString('hex')

      return result
    })
}
