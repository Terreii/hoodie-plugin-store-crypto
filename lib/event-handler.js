'use strict'

/*
 * Event handling core.
 * All methods and event handling is setup here.
 * Only listen to events of the parent, if there are some handler listing to this.
 *
 * Mostly copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var decryptOne = require('./helpers/decrypt-one')
var updateListening = require('./utils/update-listening')
var isEncrypedDocument = require('./utils/is-encrypted-object').isEncrypedDocument

module.exports = eventHandler

function eventHandler (state, prefix, parentEmitter, emitter, api, isRoot) {
  var prefixState = {
    isListening: false,
    isWithPassword: !isRoot && prefix == null, // is cryptoStore.withPassword()
    api: api,
    emitter: emitter,
    parentEmitter: parentEmitter
  }

  var handlerToUpdate = prefix == null ? noPrefixEventHandler : prefixHandler

  // only listen to events from parent if there is a handler
  emitter.on('removeListener', function (type, handler) {
    updateListening(null, prefixState, handlerToUpdate)
  })
  emitter.on('newListener', function (type, handler) {
    // newListener will be emitted before the listener will be added.
    updateListening(type, prefixState, handlerToUpdate)
  })

  api.on = require('./on').bind(null, prefixState)
  api.off = require('./off').bind(null, prefixState)
  api.one = require('./one').bind(null, prefixState)

  // for event emitter with no prefix
  function noPrefixEventHandler (eventName, object) {
    if (state.key == null || state.key.length === 0) {
      return
    }

    if (!isEncrypedDocument(object) || /^hoodiePluginCryptoStore\//.test(object._id)) {
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

  // for all child emitters
  function prefixHandler (eventName, object) {
    if (object._id.substr(0, prefix.length) !== prefix) {
      return
    }

    emitter.emit('change', eventName, object)
    emitter.emit(eventName, object)
  }
}
