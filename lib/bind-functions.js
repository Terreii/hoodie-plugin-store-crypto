'use strict'

module.exports = bindFunctions

function bindFunctions (store, state, prefix) {
  return {
    add: require('./add').bind(null, store, state, prefix),
    find: function () {},
    findAll: function () {},
    findOrAdd: function () {},
    update: function () {},
    updateOrAdd: function () {},
    updateAll: function () {},
    remove: function () {},
    removeAll: function () {},

    withIdPrefix: function () {},
    on: function () {},
    one: function () {},
    off: function () {},

    setPassword: require('./set-password').bind(null, store, state),
    withPassword: function () {}
  }
}
