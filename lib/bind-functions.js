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
      var nextParentEmitter = prefix == null ? emitter : parentEmitter

      return bindFunctions(store, state, nextPrefix, nextParentEmitter)
    },

    withPassword: function () {}
  }

  if (prefix == null) {
    api.setPassword = require('./set-password').bind(null, store, state)
  }

  var prefixState = {
    isListening: false,
    api: api,
    emitter: emitter
  }

  function updateListening (wasAdded) {
    // count all event handlers
    var handlerCount = [
      'add',
      'update',
      'remove',
      'change'
    ].reduce(function (sum, type) {
      var count = emitter.listenerCount(type)
      return sum + count
    }, wasAdded ? 1 : 0) // 1 if a handler was added, 0 if removed

    var shouldListen = handlerCount > 0

    if (shouldListen === prefixState.isListening) return

    if (shouldListen) {
      prefixState.isListening = true
      parentEmitter.on('change', handler)
    } else {
      prefixState.isListening = false
      parentEmitter.removeListener('change', handler)
    }
  }

  // only listen to events from parent if there is a handler
  emitter.on('removeListener', function (type, handler) {
    updateListening(false)
  })
  emitter.on('newListener', function (type, handler) {
    // newListener will be fired before the listener will be added.
    updateListening(true)
  })

  api.on = require('./on').bind(null, prefixState)
  api.off = require('./off').bind(null, prefixState)
  api.one = require('./one').bind(null, prefixState)

  function handler (eventName, object) {
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
  }

  return api
}
