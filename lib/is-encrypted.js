'use strict'

var Promise = require('lie')
var pouchdbErrors = require('pouchdb-errors')

var isEncryptedObject = require('./utils/is-encrypted-object')

module.exports = isEncrypted

function isEncrypted (object) {
  checkObject(object)

  if (typeof object.then === 'function') {
    return Promise.resolve(object)

      .then(function (doc) {
        checkObject(doc)

        return isEncryptedObject(doc)
      })
  }

  return isEncryptedObject(object)
}

function checkObject (object) {
  if (object == null || typeof object !== 'object') {
    throw pouchdbErrors.NOT_AN_OBJECT
  }
}
