'use strict'

var EventEmitter = require('events').EventEmitter

var decryptOne = require('./helpers/decrypt-one')

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

      return bindFunctions(store, state, nextPrefix, emitter)
    },

    withPassword: function () {}
  }

  if (prefix == null) {
    api.setPassword = require('./set-password').bind(null, store, state)
  }

  var prefixState = {
    api: api,
    emitter: emitter
  }

  api.on = require('./on').bind(null, prefixState)
  api.off = require('./off').bind(null, prefixState)
  api.one = require('./one').bind(null, prefixState)

  parentEmitter.on('change', function (eventName, object) {
    if (prefix != null && object._id.substr(0, prefix.length) !== prefix) {
      return
    }

    // for all child emitters
    if (prefix != null) {
      emitter.emit('change', eventName, object)
      emitter.emit(eventName, object)
      return
    }

    if (state.key == null || state.key.length === 0) {
      return
    }

    decryptOne(state.key, object)
      .then(function (object) {
        emitter.emit('change', eventName, object)
        emitter.emit(eventName, object)
      })
  })

  return api
}
