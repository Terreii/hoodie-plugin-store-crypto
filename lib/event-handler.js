'use strict'

var decryptOne = require('./helpers/decrypt-one')
var updateListening = require('./utils/update-listening')

module.exports = eventHandler

function eventHandler (state, prefix, parentEmitter, emitter, api) {
  var prefixState = {
    isListening: false,
    api: api,
    emitter: emitter,
    parentEmitter: parentEmitter
  }

  // only listen to events from parent if there is a handler
  emitter.on('removeListener', function (type, handler) {
    updateListening(false, prefixState, prefixHandler)
  })
  emitter.on('newListener', function (type, handler) {
    // newListener will be fired before the listener will be added.
    updateListening(true, prefixState, prefixHandler)
  })

  api.on = require('./on').bind(null, prefixState)
  api.off = require('./off').bind(null, prefixState)
  api.one = require('./one').bind(null, prefixState)

  function prefixHandler (eventName, object) {
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
}
