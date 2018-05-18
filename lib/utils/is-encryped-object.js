'use strict'

module.exports = isEncrypedObject

function isEncrypedObject (object) {
  return typeof object.nonce === 'string' &&
    typeof object._id === 'string' &&
    typeof object.tag === 'string' &&
    object.tag.length === 32 &&
    typeof object.data === 'string'
}
