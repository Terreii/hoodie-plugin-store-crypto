'use strict'

module.exports = bindFunctions

function bindFunctions (store, state, prefix) {
  return {
    add: require('./add').bind(null, store, state, prefix),
    find: require('./find').bind(null, store, state, prefix),
    findAll: require('./find-all').bind(null, store, state, prefix),
    findOrAdd: require('./find-or-add').bind(null, store, state, prefix),
    update: require('./update').bind(null, store, state, prefix),
    updateOrAdd: require('./update-or-add').bind(null, store, state, prefix),
    updateAll: require('./update-all').bind(null, store, state, prefix),
    remove: require('./remove').bind(null, store, state, prefix),
    removeAll: function () {},

    withIdPrefix: function () {},
    on: function () {},
    one: function () {},
    off: function () {},

    setPassword: require('./set-password').bind(null, store, state),
    withPassword: function () {}
  }
}
