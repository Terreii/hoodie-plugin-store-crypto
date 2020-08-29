'use strict'

module.exports = pull

var Promise = require('lie')

/**
 * Pull documents from a remote database.
 * @param {string[]}                ids     Document ids
 * @param {PouchDB.Database}        db      Local PouchDB database.
 * @param {string|PouchDB.Database} remote  Remote PouchDB database, or its URL.
 */
function pull (ids, db, remote) {
  return new Promise(function (resolve, reject) {
    var pulledObjects = []

    var replication = db.replicate.from(remote, {
      doc_ids: ids
    })

    replication.on('complete', function () {
      resolve(pulledObjects)
    })

    replication.on('error', reject)

    replication.on('change', function (change) {
      pulledObjects = pulledObjects.concat(change.docs)
    })
  })
}
