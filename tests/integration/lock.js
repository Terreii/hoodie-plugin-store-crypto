'use strict'

const test = require('tape')

const createCryptoStore = require('../utils/createCryptoStore')
const cryptoStoreSetupFunction = require('../../hoodie/client')

test('lock exists', t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.lock, 'function', 'lock is a function')
  t.is(hoodie.cryptoStore.lock.length, 0, 'lock needs no arguments')
})

test('lock locks the cryptoStore', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'test',
      value: 2
    })

    const result = hoodie.cryptoStore.lock()
    t.is(result, true, 'cryptoStore was locked')

    try {
      await hoodie.cryptoStore.find('test')
      t.fail('no error was thrown')
    } catch (err) {
      t.pass('an error was thrown')
    }
  } catch (err) {
    t.end(err)
  }
})

test("lock is added to hoodie.account.on('signout')", t => {
  t.plan(2)

  var hoodie = {
    account: {
      on (eventName, handler) {
        t.is(eventName, 'signout', 'is listening to signout events')
        t.is(handler, hoodie.cryptoStore.lock, 'is the lock function')
      }
    },
    store: {
      on () {},
      off () {},
      one () {}
    }
  }

  cryptoStoreSetupFunction(hoodie)
})
