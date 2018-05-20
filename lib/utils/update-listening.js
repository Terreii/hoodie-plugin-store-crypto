'use strict'

module.exports = updateListening

function updateListening (wasAdded, prefixState, handler) {
  var eventName = prefixState.isWithPassword ? 'change-with-other-password' : 'change'

  // count all event handlers
  var handlerCount = [
    'add',
    'update',
    'remove',
    'change',
    'change-with-other-password'
  ].reduce(function (sum, type) {
    var count = prefixState.emitter.listenerCount(type)
    return sum + count
  }, wasAdded ? 1 : 0) // 1 if a handler was added, 0 if removed

  var shouldListen = handlerCount > 0

  if (shouldListen === prefixState.isListening) return

  if (shouldListen) {
    prefixState.isListening = true
    prefixState.parentEmitter.on(eventName, handler)
  } else {
    prefixState.isListening = false
    prefixState.parentEmitter.removeListener(eventName, handler)
  }
}
