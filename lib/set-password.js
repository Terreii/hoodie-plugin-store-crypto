'use strict'

var createKey = require('./create-key')

module.exports = setPassword

function setPassword (store, state, isRoot, password, salt) {
  if (isRoot) {
    return store.find('_design/cryptoStore/salt')

      .catch(function (error) {
        if (error.status !== 404) {
          throw error
        }

        return {
          _id: '_design/cryptoStore/salt',
          salt: undefined
        }
      })

      .then(function (doc) {
        var saltToUse = typeof salt === 'string' && salt.length === 32 ? salt : doc.salt
        return setPassword(store, state, false, password, saltToUse)

          .then(function (salt) {
            if (salt === doc.salt) {
              return salt
            }

            doc.salt = salt
            return store.updateOrAdd(doc)

              .then(function () {
                return salt
              })
          })
      })
  }

  return createKey(password, salt)

    .then(function (res) {
      state.key = res.key
      state.salt = res.salt

      // if salt was created it needs to be saved!
      return res.salt
    })
}
