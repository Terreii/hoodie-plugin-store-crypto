'use strict'

module.exports.isEncrypedDocument = isEncrypedDocument
module.exports.isEncrypedObject = isEncrypedObject

function isEncrypedDocument (object) {
  return typeof object._id === 'string' && isEncrypedObject(object)
}

function isEncrypedObject (object) {
  return typeof object.nonce === 'string' &&
    typeof object.tag === 'string' &&
    object.tag.length === 32 &&
    typeof object.data === 'string'
}
