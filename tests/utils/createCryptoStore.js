'use strict'

var Store = require('@hoodie/store-client')

var cryptoStore = require('../../')

var PouchDB = require('./pouchdb.js')
var uniqueName = require('./unique-name')

module.exports = createCryptoStore

function createCryptoStore () {
  var name = uniqueName()

  var store = new Store(name, {
    PouchDB: PouchDB,
    remote: 'remote-' + name
  })

  var hoodie = {
    store: store
  }

  cryptoStore(hoodie)

  return hoodie
}
