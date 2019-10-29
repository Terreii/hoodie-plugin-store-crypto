var test = require('tape')
var Store = require('@hoodie/store-client')

var cryptoStore = require('../../')

var PouchDB = require('../utils/pouchdb.js')
var uniqueName = require('../utils/unique-name')

test('cryptoStore should listen to account/signout events', t => {
  t.plan(3)

  var name = uniqueName()
  var hoodie = {
    account: null,
    store: new Store(name, {
      PouchDB: PouchDB,
      remote: 'remote-' + name
    })
  }

  hoodie.account = {
    on: function (eventName, handler) {
      t.equal(eventName, 'signout', 'eventName is signout')
      t.equal(typeof handler, 'function', 'handler is a function')
      t.equal(handler, hoodie.cryptoStore.lock, 'handler is cryptoStore.lock')
    }
  }

  try {
    cryptoStore(hoodie)
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore should work with a not complete Hoodie-client', t => {
  t.plan(1)

  var name = uniqueName()

  var hoodie = {
    // no account
    store: new Store(name, {
      PouchDB: PouchDB,
      remote: 'remote-' + name
    })
  }

  try {
    cryptoStore(hoodie)

    t.ok(hoodie.cryptoStore, 'cryptoStore exists')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore does not encrypt fields starting with _', async t => {
  t.plan(1)

  var name = uniqueName()

  var hoodie = {
    account: { on: function () {} },
    store: new Store(name, {
      PouchDB: PouchDB,
      remote: 'remote-' + name
    })
  }

  cryptoStore(hoodie)

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
      account: { on: function () {} },
      store: new Store(name, {
        PouchDB: PouchDB,
        remote: 'remote-' + name
      })
    }

    cryptoStore(hoodie, { notHandleSpecialDocumentMembers: true })

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
