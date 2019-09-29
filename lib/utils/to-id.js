// original from https://github.com/Terreii/hoodie-store-client/blob/master/lib/utils/to-id.js

module.exports = function objectOrIdToId (objectOrId) {
  return typeof objectOrId === 'object' ? objectOrId._id : objectOrId
}
