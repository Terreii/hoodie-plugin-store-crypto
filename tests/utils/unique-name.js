/*
 * Copied from https://github.com/hoodiehq/hoodie-store-client
 */

module.exports = uniqueName

let nr = 0
function uniqueName () {
  return 'db-' + (++nr)
}
