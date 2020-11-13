const nativeCrypto = require('crypto')
const subtle = require('../../lib/utils/msrcrypto').subtle

// Translate the used Web-Crypto to node.js crypto module.
// This will be removed once I test only in browsers.

const webHashToNode = {
  'SHA-256': 'sha256'
}

global.crypto = {
  subtle: {
    async importKey (format, keyData, algorithm, extractable, keyUsages) {
      if (format !== 'raw') {
        throw new TypeError('format must be raw')
      }

      if (algorithm.name === 'PBKDF2') {
        if (extractable) {
          throw new TypeError('extractable must be false')
        }
        return {
          type: 'key',
          keyData,
          algorithm: algorithm.name,
          extractable,
          keyUsages
        }
      } else if (algorithm.name === 'AES-GCM') {
        return subtle.importKey(format, keyData, algorithm, extractable, keyUsages)
      }
    },

    deriveBits (algorithm, baseKey, length) {
      if (algorithm.name !== baseKey.algorithm) {
        return Promise.reject(new TypeError('Algorithm missmatch'))
      }
      const digest = webHashToNode[algorithm.hash.name]
      const salt = algorithm.salt
      const iterations = algorithm.iterations
      const len = length >> 3

      return new Promise((resolve, reject) => {
        nativeCrypto.pbkdf2(baseKey.keyData, salt, iterations, len, digest, (err, derivedKey) => {
          if (err) {
            reject(err)
          } else {
            resolve(derivedKey)
          }
        })
      })
    },

    encrypt: subtle.encrypt,
    decrypt: subtle.decrypt
  }
}
