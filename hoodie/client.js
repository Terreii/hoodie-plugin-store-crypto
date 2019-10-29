'use strict'

var bindFunctions = require('../lib/bind-functions')

module.exports = cryptoStore

function cryptoStore (hoodie, options) {
  var withIdPrefixStore = {} // store prefix APIs from hoodie-store. Workaround for #42

  var state = {
    getWithPrefixAPI: function (prefix) { // get a prefix API. This is a workaround for #42
      if (prefix == null) {
        return hoodie.store
      }

      if (withIdPrefixStore[prefix] != null) {
        return withIdPrefixStore[prefix]
      }

      withIdPrefixStore[prefix] = hoodie.store.withIdPrefix(prefix)
      return withIdPrefixStore[prefix]
    },
    handleSpecialMembers: options != null && Boolean(options.handleSpecialDocumentMembers),
    noPasswordCheckAutoFix: options != null && Boolean(options.noPasswordCheckAutoFix)
  }

  if (state.noPasswordCheckAutoFix) {
    console.warn(
      'Salt doc without a password check is deprecated!\n\n' +
      'Read more at https://github.com/Terreii/hoodie-plugin-store-crypto/' +
      'blob/latest/docs/update.md#v3-update-notes'
    )
  }

  var handler = {
    on: hoodie.store.on,
    once: hoodie.store.one,
    removeListener: hoodie.store.off
  }

  hoodie.cryptoStore = bindFunctions(hoodie.store, state, null, handler, true)

  if ('account' in hoodie && typeof hoodie.account.on === 'function') {
    hoodie.account.on('signout', hoodie.cryptoStore.lock)
  } else {
    console.warn(
      "Couldn't find hoodie.account.on\n\nhoodie-plugin-store-crypto will not lock on signout!"
    )
  }
}
