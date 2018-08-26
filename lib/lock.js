'use strict'

var randomBytes = require('randombytes')

module.exports = lock

function lock (state) {
  if (state.key == null) return false

  var keyLength = state.key.length

  // overwrite the memory 10 times
  for (var i = 0; i < 10; ++i) {
    var bytes = randomBytes(keyLength)

    for (var j = 0; j < keyLength; j++) {
      state.key[j] = bytes[j]
    }
  }

  state.key = null
  state.salt = null

  return true
}
