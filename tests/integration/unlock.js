'use strict'

var test = require('tape')
var Store = require('@hoodie/store-client')
var pouchdbErrors = require('pouchdb-errors')

var cryptoStore = require('../../')

var createCryptoStore = require('../utils/createCryptoStore')
var PouchDB = require('../utils/pouchdb.js')
var uniqueName = require('../utils/unique-name')

test('cryptoStore.unlock(password) should use the saved salt', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.store.add({
    _id: 'hoodiePluginCryptoStore/salt',
    salt: 'bf11fa9bafca73586e103d60898989d4'
  })

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      t.pass('does unlock, and not fail')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.unlock(password) move and use old salt doc', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.store.add({
    _id: '_design/cryptoStore/salt',
    salt: 'bf11fa9bafca73586e103d60898989d4'
  })

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(function () {
      return hoodie.store.find('_design/cryptoStore/salt')
    })

    .catch(function (err) {
      t.equal(err.status, 404, 'old doc is deleted')

      return hoodie.store.find('hoodiePluginCryptoStore/salt')
    })

    .then(function (doc) {
      t.equal(doc.salt, 'bf11fa9bafca73586e103d60898989d4', 'new salt doc has same salt')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test(
  "cryptoStore.unlock(password) should try to pull the salt doc from remote if it doesn't exist",
  function (t) {
    t.plan(1)

    var name = uniqueName()
    var remoteDbName = 'remote-' + name
    var remoteDb = new PouchDB(remoteDbName)
    var store = new Store(name, {
      PouchDB: PouchDB,
      remote: remoteDb
    })

    var hoodie = {
      account: {
        on: function () {}
      },
      store: store
    }
    cryptoStore(hoodie)

    remoteDb.put({
      _id: '_design/cryptoStore/salt',
      salt: 'bf11fa9bafca73586e103d60898989d4',
      hoodie: {
        createdAt: new Date().toJSON()
      }
    })

      .then(function () {
        return hoodie.cryptoStore.unlock('test')
      })

      .then(function () {
        return hoodie.store.find('hoodiePluginCryptoStore/salt')
      })

      .then(function (doc) {
        t.equal(doc.salt, 'bf11fa9bafca73586e103d60898989d4', 'salt doc was pulled')
      })

      .catch(function (err) {
        t.fail(err)
      })
  }
)

test('cryptoStore.unlock(password) should fail if local and remote have no salt doc', function (t) {
  t.plan(1)

  var name = uniqueName()
  var remoteDbName = 'remote-' + name
  var remoteDb = new PouchDB(remoteDbName)
  var store = new Store(name, {
    PouchDB: PouchDB,
    remote: remoteDb
  })

  var hoodie = {
    account: {
      on: function () {}
    },
    store: store
  }
  cryptoStore(hoodie)

  hoodie.cryptoStore.unlock('test')

    .then(function () {
      t.fail("setUp didn't fail")
    })

    .catch(function (err) {
      t.equal(err.name, pouchdbErrors.MISSING_DOC.name, 'fails with PouchDB unauthorized error')
    })
})

test('cryptoStore.unlock(password) should fail if the salt is not a 32 char string', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.store.add({
    _id: '_design/cryptoStore/salt',
    salt: 'bf11fa9bafca73586e103d60898989'
  })

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
    })

    .then(
      function () {
        t.fail('unlock didn\'t fail')
      },
      function (err) {
        t.equal(err.status, pouchdbErrors.BAD_ARG.status)
        t.equal(err.reason, 'salt in "hoodiePluginCryptoStore/salt" must be a 32 char string!')
      }
    )
})
