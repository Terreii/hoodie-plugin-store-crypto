'use strict'

const Store = require('@hoodie/store-client')

const cryptoStore = require('../../')

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
    store: store
  }

  cryptoStore(hoodie, options)

  return hoodie
}
