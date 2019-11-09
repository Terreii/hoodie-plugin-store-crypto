'use strict'

const test = require('tape')

const createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.changePassword() works after a reset of the hoodie store', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.store.reset()

    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.changePassword('test', 'otherPassword')
    t.pass('ok')
  } catch (err) {
    t.error(err)
  }
})

test('cryptoStore.findAll() works after a reset of the hoodie store', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.store.reset()

    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([{ value: 'a' }, { value: 'b' }])

    const docs = await hoodie.cryptoStore.findAll()
    t.equal(docs.length, 2, 'did find 2')
  } catch (err) {
    t.error(err)
  }
})

test('cryptoStore.updateAll() works after a reset of the hoodie store', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.store.reset()

    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([{ value: 'a' }, { value: 'b' }])

    const docs = await hoodie.cryptoStore.updateAll({ other: 'c' })

    t.equal(docs.length, 2, 'did update 2')
    t.equal(docs[0].other, 'c', 'was updated')
    t.equal(docs[1].other, 'c', 'was updated')
  } catch (err) {
    t.error(err)
  }
})

test('cryptoStore.removeAll() works after a reset of the hoodie store', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.store.reset()

    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([{ value: 'a' }, { value: 'b' }])

    const docs = await hoodie.cryptoStore.removeAll()

    t.equal(docs.length, 2, 'did delete 2')
    t.equal(docs[0]._deleted, true, 'was deleted')
    t.equal(docs[1]._deleted, true, 'was deleted')
  } catch (err) {
    t.error(err)
  }
})
