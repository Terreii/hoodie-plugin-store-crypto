'use strict'

var Promise = require('lie')
var PouchDBErrors = require('pouchdb-errors')

var encrypt = require('../encrypt')

module.exports = encryptOne

function encryptOne (state, prefix, doc) {
  if (doc instanceof Error) return Promise.resolve(doc)

  if (typeof doc !== 'object') {
    return Promise.reject(PouchDBErrors.NOT_AN_OBJECT)
  }

  return encrypt(state, doc, prefix)
}
