'use strict'

var Promise = require('lie')
var PouchDBErrors = require('pouchdb-errors')

var decrypt = require('../decrypt-doc')

module.exports = decryptOne

function decryptOne (key, doc) {
  if (typeof doc !== 'object') {
    return Promise.reject(PouchDBErrors.NOT_AN_OBJECT)
  }

  if (doc instanceof Error) {
    return Promise.reject(doc)
  }

  return decrypt(key, doc)
}
