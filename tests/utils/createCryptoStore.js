'use strict'

const Store = require('@hoodie/store-client')

const CryptoStore = require('../../index')

const PouchDB = require('./pouchdb.js')
const uniqueName = require('./unique-name')

module.exports = createCryptoStore

function createCryptoStore (options) {
  const name = uniqueName()

  const store = new Store(name, {
    PouchDB: PouchDB,
    remote: 'remote-' + name
  })

  const hoodie = {
    account: {
      on: () => {}
    },
    store: store,
    cryptoStore: new CryptoStore(store, options)
  }

  return hoodie
}
