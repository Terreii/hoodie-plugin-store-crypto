'use strict'

/*
 * Event handling core.
 * All methos and event handling is setup here.
 * Only listen to events of the parent, if there are some handler listing to this.
 *
 * Mostly copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var decryptOne = require('./helpers/decrypt-one')
var updateListening = require('./utils/update-listening')
var isEncryptedObject = require('./utils/is-encrypted-object')

module.exports = eventHandler

function eventHandler (state, prefix, parentEmitter, emitter, api, isRoot) {
  var prefixState = {
    isListening: false,
    isWithPassword: !isRoot && prefix == null, // is cryptoStore.withPassword()
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

    if (!isEncryptedObject(object)) {
      return
    }

    decryptOne(state.key, object)
      .then(function (object) {
        emitter.emit('change', eventName, object)
        emitter.emit(eventName, object)
      })

      .catch(function (err) {
        // if it is the root: send a special event and let withPassword instances try to decrypt it.
        if (!isRoot) {
          throw err // if it is the base/root of a withPassword instance, then rethrow the error.
        }

        emitter.emit('change-with-other-password', eventName, object)
      })
  }
}
