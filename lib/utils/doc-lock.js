'use strict'

var PouchDBErrors = require('pouchdb-errors')

var toIdWithPrefix = require('./to-id-with-prefix')

module.exports = docLock

var idSet = new Set()

/**
 * Set a lock for a doc id (or multiple).
 *
 * Locks will be used by all methods that write docs.
 * @param {string?}         prefix Optional prefix of the id.
 * @param {string|string[]} docId  Id of the document that should be locked.
 * @returns {function}             An unlock function to remove the lock.
 */
function docLock (prefix, docId) {
  if (Array.isArray(docId)) {
    var ids = docId.map(toIdWithPrefix.bind(null, prefix))

    if (ids.some(function (id) { return idSet.has(id) })) {
      throw PouchDBErrors.REV_CONFLICT
    }

    ids.forEach(function (id) {
      idSet.add(id)
    })

    return function unlockAll () {
      ids.forEach(function (id) {
        idSet.delete(id)
      })
    }
  }

  var id = toIdWithPrefix(prefix, docId)

  if (idSet.has(id)) {
    throw PouchDBErrors.REV_CONFLICT
  }

  idSet.add(id)
  return function unlock () {
    idSet.delete(id)
  }
}
