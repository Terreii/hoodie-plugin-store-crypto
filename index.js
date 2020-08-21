'use strict'

module.exports = CryptoStore

var bindFunctions = require('./lib/bind-functions')

function CryptoStore (store, options) {
  if (!(this instanceof CryptoStore)) return new CryptoStore(store, options)

  var withIdPrefixStore = {} // store prefix APIs from hoodie-store. Workaround for #42

  var state = {
    getWithPrefixAPI: function (prefix) { // get a prefix API. This is a workaround for #42
      if (prefix == null) {
        return store
      }

      if (prefix in withIdPrefixStore) {
        return withIdPrefixStore[prefix]
      }

      withIdPrefixStore[prefix] = store.withIdPrefix(prefix)
      return withIdPrefixStore[prefix]
    },
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
    on: store.on,
    once: store.one,
    removeListener: store.off
  }

  const api = bindFunctions(store, state, null, handler, true)
  Object.assign(this, api)
}
