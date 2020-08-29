'use strict'

module.exports = createPouchCryptoStore

const CryptoStore = require('../../index')

const PouchDB = require('./pouchdb.js')
const uniqueName = require('./unique-name')

/**
 * Create a CryptoStore instance with uses pouchdb-hoodie-api.
 * Together local and remote PouchDB database.
 * @param {object} options Options
 * @param {PouchDB.Database | string | undefined} options.remote  Remote PouchDB instance
 * @param {boolean?} options.noPasswordCheckAutoFix        Should a missing password check be fixed?
 */
function createPouchCryptoStore (options) {
  const name = uniqueName()

  const db = new PouchDB(name, { adapter: 'memory' })
  const remote = options != null && 'remote' in options
    ? options.remote
    : new PouchDB('remote-' + name, { adapter: 'memory' })

  return {
    db,
    remote,
    cryptoStore: new CryptoStore(db.hoodieApi(), {
      ...options,
      remote
    })
  }
}
