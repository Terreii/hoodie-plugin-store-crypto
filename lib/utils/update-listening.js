'use strict'

module.exports = updateListening

function updateListening (addedEventName, prefixState, handler) {
  var eventName = prefixState.isWithPassword ? 'change-with-other-password' : 'change'

  // newListener event will be emitted before the listener will be added!
  // But the removeListener event after the listener was removed!
  // That is why type === addedEventName is needed.
  var shouldListen = [
    'add',
    'update',
    'remove',
    'change',
    'change-with-other-password'
  ].some(function (type) {
    return type === addedEventName || prefixState.emitter.listenerCount(type) > 0
  })

  if (shouldListen === prefixState.isListening) return

  prefixState.isListening = shouldListen

  if (shouldListen) {
    prefixState.parentEmitter.on(eventName, handler)
  } else {
    prefixState.parentEmitter.removeListener(eventName, handler)
  }
}
