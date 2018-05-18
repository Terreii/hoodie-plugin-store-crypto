'use strict'

var assign = require('lodash/assign')
var keys = require('lodash/keys')
var includes = require('lodash/includes')

var ignore = require('./ignore')

module.exports = updateValues

function updateValues (object, finalValues, deleted) {
  keys(object).forEach(function (key) {
    // Delete everything but ignore keys
    if (!includes(ignore, key)) {
      delete object[key]
    }
  })

  assign(object, finalValues, {
    _id: object._id,
    _rev: object._rev,
    hoodie: object.hoodie
  })

  if (deleted) {
    object._deleted = true
  } else if (object._deleted !== undefined) {
    delete object._deleted
  }
}
