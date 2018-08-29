'use strict'

var test = require('tape')

var createCryptoStore = require('../utils/createCryptoStore')
var cryptoStoreSetupFunction = require('../../')

test('lock exists', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.lock, 'function', 'lock is a function')
  t.is(hoodie.cryptoStore.lock.length, 0, 'lock needs no arguments')
})

test('lock locks the cryptoStore', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test',
        value: 2
      })
    })

    .then(function () {
      var result = hoodie.cryptoStore.lock()

      t.is(result, true, 'cryptoStore was locked')

      return hoodie.cryptoStore.find('test')
    })

    .then(function () {
      t.fail('no error was thrown')
    })

    .catch(function () {
      t.pass('an error was thrown')
    })
})

test("lock is added to hoodie.account.on('signout')", function (t) {
  t.plan(2)

  var hoodie = {
    account: {
      on: function (eventName, handler) {
        t.is(eventName, 'signout', 'is listening to signout events')
        t.is(handler, hoodie.cryptoStore.lock, 'is the lock function')
      }
    },
    store: {
      on: function () {},
      off: function () {},
      one: function () {}
    }
  }

  cryptoStoreSetupFunction(hoodie)
})
