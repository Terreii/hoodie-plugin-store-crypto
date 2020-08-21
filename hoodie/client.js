'use strict'

module.exports = cryptoStore

var CryptoStore = require('../index')

function cryptoStore (hoodie, options) {
  hoodie.cryptoStore = new CryptoStore(hoodie.store, options)

  if ('account' in hoodie && typeof hoodie.account.on === 'function') {
    hoodie.account.on('signout', hoodie.cryptoStore.lock)
  } else {
    console.warn(
      "Couldn't find hoodie.account.on\n\nhoodie-plugin-store-crypto will not lock on signout!"
    )
  }
}
