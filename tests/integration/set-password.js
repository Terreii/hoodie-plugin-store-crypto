'use strict'

var test = require('tape')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.setPassword(password) should generate a salt if non is passed', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function (salt) {
      t.is(typeof salt, 'string', 'salt exists')
      t.is(salt.length, 32, 'salt has correct length')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.setPassword(password, salt) should use the passed salt', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test', 'bf11fa9bafca73586e103d60898989d4')

    .then(function (salt) {
      t.is(salt, 'bf11fa9bafca73586e103d60898989d4', 'returns same salt')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.setPassword(password) should save the generated salt', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function (salt) {
      return hoodie.store.db.get('_design/cryptoStore/salt')

        .then(function (doc) {
          t.equal(doc.salt, salt, 'salt is saved')
        })
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.setPassword(password, salt) should save the passed salt', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test', 'bf11fa9bafca73586e103d60898989d4')

    .then(function (salt) {
      return hoodie.store.db.get('_design/cryptoStore/salt')

        .then(function (doc) {
          t.equal(doc.salt, 'bf11fa9bafca73586e103d60898989d4', 'salt is saved')
        })
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.setPassword(password) should use the save salt', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.store.add({
    _id: '_design/cryptoStore/salt',
    salt: 'bf11fa9bafca73586e103d60898989d4'
  })

    .then(function () {
      return hoodie.cryptoStore.setPassword('test')
    })

    .then(function (salt) {
      t.is(salt, 'bf11fa9bafca73586e103d60898989d4', 'uses old salt')
    })

    .catch(function (err) {
      t.end(err)
    })
})
