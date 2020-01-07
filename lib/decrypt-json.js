'use strict'

module.exports = decrypt

var PouchDBErrors = require('pouchdb-errors')
var Promise = require('lie')

var decryptCore = require('./helpers/decrypt-core')

/**
 * Decrypt any encrypted JSON data.
 * @param {Object} state crypto config
 * @param {Object} data  Encrypted data.
 * @param {string} [aad] Additional data. To validate the encrypted data.
 */
function decrypt (state, data, aad) {
  var key = state.key
  if (key == null || key.length < 32) {
    return Promise.reject(PouchDBErrors.UNAUTHORIZED)
  }

  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return Promise.reject(PouchDBErrors.createError(
      PouchDBErrors.BAD_REQUEST,
      'Data was undefined. Data is must be an object!'
    ))
  }

  if (
    typeof data.data !== 'string' ||
    typeof data.tag !== 'string' ||
    typeof data.nonce !== 'string'
  ) {
    return Promise.reject(PouchDBErrors.createError(
      PouchDBErrors.BAD_REQUEST,
      'Data was invalid. It must be an object with data, tag and nonce!'
    ))
  }

  var dataBuffer = Buffer.from(data.data, 'hex')
  var tag = Buffer.from(data.tag, 'hex')
  var nonce = Buffer.from(data.nonce, 'hex')
  var additionalData = aad ? Buffer.from(aad) : undefined

  return decryptCore(key, nonce, dataBuffer, tag, additionalData)

    .then(function (result) {
      return JSON.parse(result)
    })
}
