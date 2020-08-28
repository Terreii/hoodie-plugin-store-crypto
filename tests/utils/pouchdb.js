/*
 * Copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

module.exports = require('pouchdb-core')
  .plugin(require('pouchdb-replication'))
  .plugin(require('pouchdb-adapter-memory'))
  .plugin(require('pouchdb-hoodie-api'))
