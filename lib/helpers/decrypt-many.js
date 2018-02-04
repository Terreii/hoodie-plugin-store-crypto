'use strict'

var Promise = require('lie')

var decryptOne = require('./decrypt-one')

module.exports = decryptMany

function decryptMany (key, properties) {
  var encrypted = properties.map(function (doc) {
    if (doc instanceof Error) {
      return doc
    }

    return decryptOne(key, doc)
  })

  return Promise.all(encrypted)
}
