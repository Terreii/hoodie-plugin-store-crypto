'use scrict'

var toId = require('./to-id')

module.exports = toIdWithPrefix

function toIdWithPrefix (prefix, objectOrId) {
  var id = toId(objectOrId)

  if (prefix && id.substr(0, prefix.length) !== prefix) {
    id = prefix + id
  }

  return id
}
