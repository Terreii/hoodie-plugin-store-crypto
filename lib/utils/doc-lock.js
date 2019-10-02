'use strict'

var PouchDBErrors = require('pouchdb-errors')

var toIdWithPrefix = require('./to-id-with-prefix')

module.exports = docLock

var lockedIds = new Set()

/**
 * Set a lock for a doc id (or multiple).
 *
 * Locks will be used by all methods that write docs.
 * @param {string}          [prefix] Optional prefix of the id.
 * @param {string|string[]} docId    Id of the document that should be locked.
 * @returns {object}                 An object with an unlock function to remove the lock and
 *                                   a list of failed locks.
 */
function docLock (prefix, docId) {
  if (Array.isArray(docId)) {
    var idsOrErrors = docId.map(function (docOrId) {
      if (docOrId instanceof Error) return docOrId
      return toIdWithPrefix(prefix, docOrId)
    })

    var lockResult = idsOrErrors.reduce(function (result, id) {
      if (id instanceof Error) {
        result.failed.push(id)
      } else if (lockedIds.has(id)) {
        result.failed.push(PouchDBErrors.REV_CONFLICT)
      } else {
        lockedIds.add(id)
        result.locked.push(id)
        result.failed.push(null)
      }
      return result
    }, {
      failed: [], // map of Error|null of the ids
      locked: [] // list of all locks of this call
    })

    return {
      unlock: unlockAll.bind(null, lockResult.locked),
      failed: lockResult.failed
    }
  }

  var id = toIdWithPrefix(prefix, docId)

  if (lockedIds.has(id)) {
    throw PouchDBErrors.REV_CONFLICT
  }

  lockedIds.add(id)
  return {
    unlock: unlock.bind(null, id),
    failed: [null]
  }
}

function unlock (id) {
  lockedIds.delete(id)
}

function unlockAll (ids) {
  ids.forEach(unlock)
}
