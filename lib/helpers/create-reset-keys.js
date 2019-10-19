'use strict'

var assign = require('lodash/assign')
var Promise = require('lie')
var randomBytes = require('randombytes')

var createKey = require('../create-key')
var encrypt = require('../encrypt')

module.exports = createResetKeys

/**
 * Create reset keys and save them in hoodiePluginCryptoStore/pwReset_{0-9} docs.
 * @param {Object} store Instance of the Hoodie-Client-Store.
 * @param {string} key Encryption key, used for encryption and decryption.
 * @returns {string[]} Array of reset keys.
 */
function createResetKeys (store, key) {
  var results = []
  var keyString = key.toString('hex')

  for (var i = 0; i < 10; ++i) {
    results.push(
      createKeyAndDoc(i, keyString)
    )
  }

  return Promise.all(results)

    .then(function (resultsDocs) {
      return store.withIdPrefix('hoodiePluginCryptoStore/pwReset_').findAll()

        .then(function (oldDocs) {
          var oldDocsIds = oldDocs.map(function (doc) { return doc._id })

          var docs = resultsDocs.map(function (aResult) {
            var doc = aResult.doc
            var index = oldDocsIds.indexOf(doc._id)

            if (index !== -1) {
              return assign(oldDocs[index], {
                salt: doc.salt,
                tag: doc.tag,
                data: doc.data,
                nonce: doc.nonce
              })
            }

            return doc
          })

          return store.updateOrAdd(docs)
        })

        .then(function () {
          return resultsDocs.map(function (aResult) {
            return aResult.key
          })
        })
    })
}

function createKeyAndDoc (index, key) {
  // create a reset password/key
  var docResetPassword = randomBytes(16).toString('hex')
  var salt = ''

  return createKey(docResetPassword)

    .then(function (result) {
      salt = result.salt

      var doc = {
        _id: 'hoodiePluginCryptoStore/pwReset_' + index,
        key: key,
        noise: randomBytes(16).toString('hex')
      }

      return encrypt({ key: result.key }, doc, null)
    })

    .then(function (encryptedDoc) {
      // add salt to encrypted doc
      // TODO: after #52 this can be deleted and an ignore key used.
      // https://github.com/Terreii/hoodie-plugin-store-crypto/issues/52
      encryptedDoc.salt = salt

      return {
        doc: encryptedDoc,
        key: docResetPassword
      }
    })
}
