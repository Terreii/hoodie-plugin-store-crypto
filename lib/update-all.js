'use strict'

var Promise = require('lie')
var isntDesignDoc = require('@hoodie/store-client/lib/utils/isnt-design-doc')

var encryptMany = require('./helpers/encrypt-many')
var decryptOne = require('./helpers/decrypt-one')
var decryptMany = require('./helpers/decrypt-many')
var ignore = require('./ignore')

module.exports = updateAll

/**
 * updates all existing docs
 *
 * @param  {Object}          store    instance of a hoodie client store
 * @param  {Object}          state    crypto config
 * @param  {String}          prefix   optional id prefix
 * @param  {Object|Function} change   changed properties or function that
 *                                    alters passed doc
 * @return {Promise}
 */
function updateAll (store, state, prefix, changedProperties) {
  var type = typeof changedProperties
  var key = state.key

  if (type !== 'object' && type !== 'function') {
    return Promise.reject(new Error('Must provide object or function'))
  }

  var options = {
    include_docs: true
  }

  if (prefix) {
    options.startkey = prefix
    options.endkey = prefix + '\uffff'
  }

  return store.db.allDocs(options)

  .then(function (result) {
    var docs = result.rows
      .filter(isntDesignDoc)
      .map(function (row) {
        return decryptOne(key, row.doc)
      })

    return Promise.all(docs)
  })

  .then(function (objects) {
    if (type === 'function') {
      objects.forEach(changedProperties)
      return objects
    }

    return objects.map(function (object) {
      Object.assign(object, changedProperties, {
        _id: object._id,
        _rev: object._rev,
        hoodie: object.hoodie
      })
      return object
    })
  })

  .then(function (objects) {
    return encryptMany(key, null, objects)
  })

  .then(function (objects) {
    var ids = objects.map(function (object) {
      return object._id
    })

    var index = 0
    return store.update(ids, function updater (object) {
      Object.keys(object).forEach(function (key) {
        // Delete everything but ignore keys
        if (!ignore.includes(key)) {
          delete object[key]
        }
      })

      Object.assign(object, objects[index], object)
      index += 1
    })
  })

  .then(function (objects) {
    return decryptMany(key, objects)
  })
}
