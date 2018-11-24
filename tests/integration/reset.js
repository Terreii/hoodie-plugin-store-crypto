'use strict'

var test = require('tape')

var createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.changePassword() works after a reset of the hoodie store', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.store.reset()

    .then(function () {
      return hoodie.cryptoStore.setup('test')
    })

    .then(function () {
      return hoodie.cryptoStore.unlock('test')
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
      return hoodie.cryptoStore.setPassword('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{ value: 'a' }, { value: 'b' }])
    })

    .then(function () {
      return hoodie.cryptoStore.findAll()
    })

    .then(function (docs) {
      t.equal(docs.length, 2, 'did find 2')
    })

    .catch(t.error)
})

test('cryptoStore.updateAll() works after a reset of the hoodie store', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.store.reset()

    .then(function () {
      return hoodie.cryptoStore.setPassword('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{ value: 'a' }, { value: 'b' }])
    })

    .then(function () {
      return hoodie.cryptoStore.updateAll({ other: 'c' })
    })

    .then(function (docs) {
      t.equal(docs.length, 2, 'did update 2')
      t.equal(docs[0].other, 'c', 'was updated')
      t.equal(docs[1].other, 'c', 'was updated')
    })

    .catch(t.error)
})

test('cryptoStore.removeAll() works after a reset of the hoodie store', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.store.reset()

    .then(function () {
      return hoodie.cryptoStore.setPassword('test')
    })

    .then(function () {
      return hoodie.cryptoStore.add([{ value: 'a' }, { value: 'b' }])
    })

    .then(function () {
      return hoodie.cryptoStore.removeAll()
    })

    .then(function (docs) {
      t.equal(docs.length, 2, 'did delete 2')
      t.equal(docs[0]._deleted, true, 'was deleted')
      t.equal(docs[1]._deleted, true, 'was deleted')
    })

    .catch(t.error)
})
