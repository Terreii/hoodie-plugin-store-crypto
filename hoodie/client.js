'use strict'

var bindFunctions = require('../lib/bind-functions')

module.exports = cryptoStore

function cryptoStore (hoodie) {
  var state = {}

  hoodie.cryptoStore = bindFunctions(hoodie.store, state, null)
}
