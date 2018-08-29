'use strict'

var bindFunctions = require('../lib/bind-functions')

module.exports = cryptoStore

function cryptoStore (hoodie) {
  var state = {}

  var handler = {
    on: hoodie.store.on,
    once: hoodie.store.one,
    removeListener: hoodie.store.off
  }

  hoodie.cryptoStore = bindFunctions(hoodie.store, state, null, handler, true)

  hoodie.account.on('signout', hoodie.cryptoStore.lock)
}
