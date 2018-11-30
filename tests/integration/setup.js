'use strict'

var test = require('tape')
var Store = require('@hoodie/store-client')
var pouchdbErrors = require('pouchdb-errors')

var cryptoStore = require('../../')

var createCryptoStore = require('../utils/createCryptoStore')
var PouchDB = require('../utils/pouchdb.js')
var uniqueName = require('../utils/unique-name')

test('cryptoStore.setup(password) should generate a salt if non is passed', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.store.find('hoodiePluginCryptoStore/salt')
    })

    .then(function (obj) {
      t.is(typeof obj.salt, 'string', 'salt exists')
      t.is(obj.salt.length, 32, 'salt has correct length')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.setup(password, salt) should use the passed salt', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test', 'bf11fa9bafca73586e103d60898989d4')

    .then(function () {
      return hoodie.store.find('hoodiePluginCryptoStore/salt')
    })

    .then(function (obj) {
      t.is(obj.salt, 'bf11fa9bafca73586e103d60898989d4', 'returns same salt')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.setup(password) should create an encrypted check for the password', function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()
  var hoodie2 = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.store.find('hoodiePluginCryptoStore/salt')
    })

    .then(function (saltDoc) {
      t.ok(saltDoc.check.tag.length === 32, 'tag part should have a length of 32')
      t.ok(saltDoc.check.data.length > 0, 'encrypted data')
      t.ok(saltDoc.check.nonce.length === 24, 'nonce should have a length of 24')

      // setup with salt passed
      return hoodie2.cryptoStore.setup('test', 'bf11fa9bafca73586e103d60898989d4')
    })

    .then(function () {
      return hoodie2.store.find('hoodiePluginCryptoStore/salt')
    })

    .then(function (saltDoc) {
      t.ok(saltDoc.check.tag.length === 32, 'tag part should have a length of 32')
      t.ok(saltDoc.check.data.length > 0, 'encrypted data')
      t.ok(saltDoc.check.nonce.length === 24, 'nonce should have a length of 24')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.setup(password) should throw if a salt doc exists', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.store.add({
    _id: '_design/cryptoStore/salt',
    salt: 'bf11fa9bafca73586e103d60898989d4'
  })

    .then(function () {
      return hoodie.cryptoStore.setup('test')
    })

    .then(function (salt) {
      t.fail("setup didn't fail")
    })

    .catch(function (err) {
      t.equal(err.name, pouchdbErrors.UNAUTHORIZED.name, 'fails with PouchDB unauthorized error')
    })
})

test('cryptoStore.setup(password) should throw if a salt doc exists on remote', function (t) {
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
      return hoodie.cryptoStore.setup('test')
    })

    .then(function (salt) {
      t.fail("setup didn't fail")
    })

    .catch(function (err) {
      t.equal(err.name, pouchdbErrors.UNAUTHORIZED.name, 'fails with PouchDB unauthorized error')
    })
})

test('cryptoStore.setup(password, salt) should throw if the salt is wrong', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test', 4)

    .then(
      function () {
        t.fail('it should have thrown on number as a salt')
      },
      function (err) {
        t.equal(err.reason, 'salt must be a 32 char string!', 'should fail on wrong type')
      }
    )

    .then(function () {
      return hoodie.cryptoStore.setup('test', 'hello world!')
    })

    .then(
      function () {
        t.fail('it should have thrown on string that is to short')
      },
      function (err) {
        t.equal(err.reason, 'salt must be a 32 char string!', 'should fail if length !== 32')
      }
    )
})

test('cryptoStore.setup(password) should not unlock', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setup('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'hello',
        test: 2
      })
    })

    .then(function () {
      t.fail('it did unlock!')
    })

    .catch(function () {
      t.pass("it didn't unlock!")
    })
})
