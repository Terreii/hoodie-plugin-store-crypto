'use strict'

var ignore = require('./ignore')

module.exports = updateValues

function updateValues (object, finalValues, deleted) {
  Object.keys(object).forEach(function (key) {
    // Delete everything but ignore keys
    if (!ignore.includes(key)) {
      delete object[key]
    }
  })

  Object.assign(object, finalValues, {
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
