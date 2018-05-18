'use strict'

var EventEmitter = require('events').EventEmitter

var eventHandler = require('./event-handler')

module.exports = bindFunctions

function bindFunctions (store, state, prefix, parentEmitter) {
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
      var nextParentEmitter = prefix == null ? emitter : parentEmitter

      return bindFunctions(store, state, nextPrefix, nextParentEmitter)
    },

    withPassword: function () {}
  }

  if (prefix == null) {
    api.setPassword = require('./set-password').bind(null, store, state)
  }

  eventHandler(state, prefix, parentEmitter, emitter, api)

  return api
}
