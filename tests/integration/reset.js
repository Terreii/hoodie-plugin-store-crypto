'use strict'

var test = require('tape')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.changePassword() works after a reset of the hoodie store', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.store.reset()

    .then(function () {
      return hoodie.cryptoStore.setPassword('test')
    })

    .then(function () {
      return hoodie.cryptoStore.changePassword('test', 'otherPassword')
    })

    .then(function () {
      t.pass('ok')
    })

    .catch(t.error)
})

test('cryptoStore.findAll() works after a reset of the hoodie store', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.store.reset()

    .then(function () {
      return hoodie.cryptoStore.findAll()
    })

    .then(function () {
      t.pass('ok')
    })

    .catch(t.error)
})

test('cryptoStore.updateAll() works after a reset of the hoodie store', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.store.reset()

    .then(function () {
      return hoodie.cryptoStore.setPassword('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({value: 'a'}, {value: 'b'})
    })

    .then(function () {
      return hoodie.cryptoStore.updateAll({other: 'c'})
    })

    .then(function () {
      t.pass('ok')
    })

    .catch(t.error)
})

test('cryptoStore.removeAll() works after a reset of the hoodie store', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.store.reset()

    .then(function () {
      return hoodie.cryptoStore.setPassword('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add({value: 'a'}, {value: 'b'})
    })

    .then(function () {
      return hoodie.cryptoStore.removeAll()
    })

    .then(function () {
      t.pass('ok')
    })

    .catch(t.error)
})
