'use strict'

/*
 * Core of the plugin.
 * All methos and event handling is setup here.
 *
 * Mostly copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

var EventEmitter = require('events').EventEmitter

var eventHandler = require('./event-handler')

module.exports = bindFunctions

/**
 * adds one or multiple objects encrypted to local database
 *
 * @param  {Object}          store           instance of a hoodie client store
 * @param  {Object}          state           crypto config
 * @param  {String|null}     prefix          optional id prefix
 * @param  {EventEmitter}    parentEmitter   EventEmitter of the root or for the root of the hoodie
 *                                           client store
 * @param  {Boolean}         isRoot          true if it is directly connected to the
 *                                           hoodie-store-client
 * @return {Object}
 */
function bindFunctions (store, state, prefix, parentEmitter, isRoot) {
  var emitter = new EventEmitter()

  var api = {
    add: require('./add').bind(null, store, state, prefix),
    find: require('./find').bind(null, store, state, prefix),
    findAll: require('./find-all').bind(null, store, state, prefix),
    findOrAdd: require('./find-or-add').bind(null, store, state, prefix),
    update: require('./update').bind(null, store, state, prefix),
    updateOrAdd: require('./update-or-add').bind(null, store, state, prefix),
    updateAll: require('./update-all').bind(null, store, state, prefix),
    remove: require('./remove').bind(null, store, state, prefix),
    removeAll: require('./remove-all').bind(null, store, state, prefix),

    withIdPrefix: function (moarPrefix) {
      var nextPrefix = prefix == null ? moarPrefix : prefix + moarPrefix
      var nextParentEmitter = prefix == null ? emitter : parentEmitter

      return bindFunctions(store, state, nextPrefix, nextParentEmitter, false)
    }
  }

  if (prefix == null && isRoot) {
    api.setPassword = require('./set-password').bind(null, store, state, true)
    api.changePassword = require('./change-password').bind(null, store, state)
    api.setup = require('./setup').bind(null, store, state)
    api.unlock = require('./unlock').bind(null, store, state)
    api.lock = require('./lock').bind(null, state)

    api.withPassword = function (password, salt) {
      var nextState = Object.create(state)
      var nextApi = bindFunctions(store, nextState, prefix, emitter, false)

      return require('./set-password')(store, nextState, false, password, salt)

        .then(function (salt) {
          return {
            store: nextApi,
            salt: salt
          }
        })
    }
  }

  eventHandler(state, prefix, parentEmitter, emitter, api, isRoot)

  return api
}
