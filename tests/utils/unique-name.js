/*
 * Copied from https://github.com/hoodiehq/hoodie-store-client
 */

module.exports = uniqueName

var nr = 0
function uniqueName () {
  return 'db-' + (++nr)
}
