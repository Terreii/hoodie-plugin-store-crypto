'use strict'

var createKey = require('./create-key')

module.exports = setPassword

function setPassword (store, state, password, salt) {
  return createKey(password, salt)

  .then(function (res) {
    state.key = res.key
    state.salt = res.salt

     // if salt was created it needs to be saved!
    return res.salt
  })
}
