// select the web crypto API

module.exports = getCrypto

var msrCryptoPolyfill = require('./msrcrypto')

var globalContext = (function () {
  try {
    return globalThis // eslint-disable-line no-undef
  } catch (err) {}

  try {
    return window
  } catch (err) {}

  try {
    return global
  } catch (err) {}

  try {
    return process
  } catch (err) {
    return undefined
  }
})()

/**
 * Get the web crypto api
 * @returns {Crypto} Web Crypto API
 */
function getCrypto () {
  if (globalContext == null) {
    return msrCryptoPolyfill
  }

  // globalContext.msCrypto (IE11) isn't listed, because it does not support deriveBits.
  // It could be added back, once the CryptoKey object is used.
  if (globalContext.crypto && globalContext.crypto.subtle) {
    return globalContext.crypto
  }
  if (globalContext.msrCrypto && globalContext.msrCrypto.subtle) {
    return globalContext.msrCrypto
  }
  return msrCryptoPolyfill
}
