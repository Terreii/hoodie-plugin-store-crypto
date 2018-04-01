'use strict'

var Promise = require('lie')

var encryptOne = require('./encrypt-one')

module.exports = encryptMany

function encryptMany (key, prefix, properties) {
  var encrypted = properties.map(function (doc) {
    if (typeof doc !== 'object') {
      // let it be handled by hoodie-store-client
      return null
    }

    return encryptOne(key, prefix, doc)
  })

  return Promise.all(encrypted)
}
