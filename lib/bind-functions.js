'use strict'

var EventEmitter = require('events').EventEmitter

module.exports = bindFunctions

function bindFunctions (store, state, prefix) {
  var emitter = new EventEmitter()

  var api = {
    add: require('./add').bind(null, store, state, prefix),
    find: require('./find').bind(null, store, state, prefix),
    findAll: require('./find-all').bind(null, store, state, prefix),
    findOrAdd: require('./find-or-add').bind(null, store, state, prefix),
    update: require('./update').bind(null, store, state, prefix),
    updateOrAdd: require('./update-or-add').bind(null, store, state, prefix),
    updateAll: require('./update-all').bind(null, store, state, prefix),
    remove: require('./remove').bind(null, store, state, prefix),
    removeAll: require('./remove-all').bind(null, store, state, prefix),

    withIdPrefix: function (moarPrefix) {
      var oldPrefix = prefix || ''
      var nextPrefix = oldPrefix + moarPrefix

      return bindFunctions(store, state, nextPrefix)
    },

    withPassword: function () {}
  }

  if (prefix == null) {
    api.setPassword = require('./set-password').bind(null, store, state)
  }

  api.on = require('./on').bind(store, state, prefix, emitter)
  api.off = require('./off').bind(store, state, prefix, emitter)
  api.one = require('./one').bind(store, state, prefix, emitter)

  return api
}
