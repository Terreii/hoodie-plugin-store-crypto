'use strict'

var Store = require('@hoodie/store-client')

var cryptoStore = require('../../')

var PouchDB = require('./pouchdb.js')
var uniqueName = require('./unique-name')

module.exports = createCryptoStore

function createCryptoStore (options) {
  var name = uniqueName()

  var store = new Store(name, {
    PouchDB: PouchDB,
    remote: 'remote-' + name
  })

  var hoodie = {
    account: {
      on: function () {}
    },
    store: store
  }

  cryptoStore(hoodie, options)

  return hoodie
}
