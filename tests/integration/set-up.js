'use strict'

var test = require('tape')
var pouchdbErrors = require('pouchdb-errors')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.setUp(password) should generate a salt if non is passed', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setUp('test')

    .then(function () {
      return hoodie.store.find('_cryptoStore/salt')
    })

    .then(function (obj) {
      t.is(typeof obj.salt, 'string', 'salt exists')
      t.is(obj.salt.length, 32, 'salt has correct length')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.setUp(password, salt) should use the passed salt', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setUp('test', 'bf11fa9bafca73586e103d60898989d4')

    .then(function () {
      return hoodie.store.find('_cryptoStore/salt')
    })

    .then(function (obj) {
      t.is(obj.salt, 'bf11fa9bafca73586e103d60898989d4', 'returns same salt')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.setUp(password) should throw if a salt doc exists', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.store.add({
    _id: '_design/cryptoStore/salt',
    salt: 'bf11fa9bafca73586e103d60898989d4'
  })

    .then(function () {
      return hoodie.cryptoStore.setUp('test')
    })

    .then(function (salt) {
      t.fail("setUp didn't fail")
    })

    .catch(function (err) {
      t.equal(err.name, pouchdbErrors.UNAUTHORIZED.name, 'fails with PouchDB unauthorized error')
    })
})
