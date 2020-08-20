const test = require('tape')
const Store = require('@hoodie/store-client')

const CryptoStore = require('../../')
const pluginSetupFunction = require('../../hoodie/client')

const PouchDB = require('../utils/pouchdb.js')
const uniqueName = require('../utils/unique-name')

test('cryptoStore should listen to account/signout events', t => {
  t.plan(3)

  const name = uniqueName()
  const hoodie = {
    account: null,
    store: new Store(name, {
      PouchDB: PouchDB,
      remote: 'remote-' + name
    })
  }

  hoodie.account = {
    on (eventName, handler) {
      t.equal(eventName, 'signout', 'eventName is signout')
      t.equal(typeof handler, 'function', 'handler is a function')
      t.equal(handler, hoodie.cryptoStore.lock, 'handler is cryptoStore.lock')
    }
  }

  try {
    pluginSetupFunction(hoodie)
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore should work with a not complete Hoodie-client', t => {
  t.plan(1)

  const name = uniqueName()

  const hoodie = {
    // no account
    store: new Store(name, {
      PouchDB: PouchDB,
      remote: 'remote-' + name
    })
  }

  try {
    pluginSetupFunction(hoodie)

    t.ok(hoodie.cryptoStore, 'cryptoStore exists')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore does not encrypt fields starting with _', async t => {
  t.plan(1)

  const name = uniqueName()

  const hoodie = {
    account: {
      on () {}
    },
    store: new Store(name, {
      PouchDB: PouchDB,
      remote: 'remote-' + name
    })
  }

  pluginSetupFunction(hoodie)

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      value: 42,
      _other: 'public'
    })

    t.fail(new Error('should have thrown with doc_validation'))
  } catch (err) {
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }
})

test(
  'cryptoStore does encrypt fields starting with _ if notHandleSpecialDocumentMembers is ' +
  'set to true',
  async t => {
    t.plan(2)

    const name = uniqueName()

    const hoodie = {
      account: { on () {} },
      store: new Store(name, {
        PouchDB: PouchDB,
        remote: 'remote-' + name
      })
    }

    pluginSetupFunction(hoodie, { notHandleSpecialDocumentMembers: true })

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      const doc = await hoodie.cryptoStore.add({
        value: 42,
        _other: 'not public'
      })
      t.is(doc._other, 'not public', 'member starting with _ was encrypted')

      const encryptedDoc = await hoodie.store.find(doc._id)
      t.is(encryptedDoc._other, undefined, 'member starting with _ is not public')
    } catch (err) {
      t.end(err)
    }
  }
)

test('default export should be a constructor', t => {
  t.plan(3)

  const name = uniqueName()
  const cryptoStore = new CryptoStore(new Store(name, {
    PouchDB: PouchDB,
    remote: 'remote-' + name
  }))

  t.is(typeof cryptoStore, 'object', 'should be an object')
  t.is(typeof cryptoStore.add, 'function', 'should have the methods')
  t.ok(cryptoStore instanceof CryptoStore, 'should be an instance of CryptoStore')
})

test('default export should not listen to account/signout events', t => {
  t.plan(1)

  const name = uniqueName()
  const store = new Store(name, {
    PouchDB: PouchDB,
    remote: 'remote-' + name
  })

  store.account = {
    on (eventName, handler) {
      t.fail('should not add an event listener')
    }
  }

  try {
    const cryptoStore = new CryptoStore(store)
    setTimeout(() => {
      t.ok(cryptoStore)
      t.end()
    }, 10)
  } catch (err) {
    t.end(err)
  }
})

test('default export does not encrypt fields starting with _', async t => {
  t.plan(1)

  const name = uniqueName()

  const store = new Store(name, {
    PouchDB: PouchDB,
    remote: 'remote-' + name
  })
  const cryptoStore = new CryptoStore(store)

  try {
    await cryptoStore.setup('test')
    await cryptoStore.unlock('test')

    await cryptoStore.add({
      value: 42,
      _other: 'public'
    })

    t.fail(new Error('should have thrown with doc_validation'))
  } catch (err) {
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }
})

test(
  'default export does encrypt fields starting with _ if notHandleSpecialDocumentMembers is ' +
  'set to true',
  async t => {
    t.plan(2)

    const name = uniqueName()

    const store = new Store(name, {
      PouchDB: PouchDB,
      remote: 'remote-' + name
    })
    const cryptoStore = new CryptoStore(store, {
      notHandleSpecialDocumentMembers: true
    })

    try {
      await cryptoStore.setup('test')
      await cryptoStore.unlock('test')

      const doc = await cryptoStore.add({
        value: 42,
        _other: 'not public'
      })
      t.is(doc._other, 'not public', 'member starting with _ was encrypted')

      const encryptedDoc = await store.find(doc._id)
      t.is(encryptedDoc._other, undefined, 'member starting with _ is not public')
    } catch (err) {
      t.end(err)
    }
  }
)
