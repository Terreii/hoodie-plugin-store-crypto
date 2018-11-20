'use strict'

var Promise = require('lie')

var assign = require('lodash/assign')
var PouchDBErrors = require('pouchdb-errors')

var encryptOne = require('../helpers/encrypt-one')

module.exports = updateObject

function updateObject (objectOrId, old, change, key, remove) {
  if (objectOrId == null || (!remove && typeof objectOrId === 'string' && change == null)) {
    return Promise.resolve(PouchDBErrors.NOT_AN_OBJECT)
  }

  if (old instanceof Error) return Promise.resolve(old)

  var object = typeof objectOrId === 'string'
    ? { _id: objectOrId }
    : objectOrId

  var changed = assign({}, old, object)

  if (typeof change === 'function') {
    change(changed)
  } else {
    assign(changed, change)
  }

  assign(changed, { _id: old._id, _rev: old._rev, hoodie: old.hoodie })

  return encryptOne(key, null, changed)
}
