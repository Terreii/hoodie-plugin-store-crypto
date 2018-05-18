'use strict'

module.exports = updateListening

function updateListening (wasAdded, prefixState, handler) {
  // count all event handlers
  var handlerCount = [
    'add',
    'update',
    'remove',
    'change'
  ].reduce(function (sum, type) {
    var count = prefixState.emitter.listenerCount(type)
    return sum + count
  }, wasAdded ? 1 : 0) // 1 if a handler was added, 0 if removed

  var shouldListen = handlerCount > 0

  if (shouldListen === prefixState.isListening) return

  if (shouldListen) {
    prefixState.isListening = true
    prefixState.parentEmitter.on('change', handler)
  } else {
    prefixState.isListening = false
    prefixState.parentEmitter.removeListener('change', handler)
  }
}
