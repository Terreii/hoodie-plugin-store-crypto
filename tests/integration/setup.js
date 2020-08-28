'use strict'

const test = require('tape')
const Store = require('@hoodie/store-client')
const pouchdbErrors = require('pouchdb-errors')

const CryptoStore = require('../../index')
const createKey = require('../../lib/create-key')
const decrypt = require('../../lib/decrypt-doc')

const createCryptoStore = require('../utils/createCryptoStore')
const createPouchCryptoStore = require('../utils/createPouchCryptoStore')
const PouchDB = require('../utils/pouchdb.js')
const uniqueName = require('../utils/unique-name')

test('cryptoStore.setup(password) should generate a salt if non is passed', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  await hoodie.cryptoStore.setup('test')

  try {
    const obj = await hoodie.store.find('hoodiePluginCryptoStore/salt')

    t.is(typeof obj.salt, 'string', 'salt exists')
    t.is(obj.salt.length, 32, 'salt has correct length')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.setup(password, salt) should use the passed salt', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  await hoodie.cryptoStore.setup('test', 'bf11fa9bafca73586e103d60898989d4')

  try {
    const obj = await hoodie.store.find('hoodiePluginCryptoStore/salt')
    t.is(obj.salt, 'bf11fa9bafca73586e103d60898989d4', 'returns same salt')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.setup(password) should create an encrypted check for the password', async t => {
  t.plan(6)

  const hoodie = createCryptoStore()
  const hoodie2 = createCryptoStore()

  await hoodie.cryptoStore.setup('test')

  try {
    const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')

    t.ok(saltDoc.check.tag.length === 32, 'tag part should have a length of 32')
    t.ok(saltDoc.check.data.length > 0, 'encrypted data')
    t.ok(saltDoc.check.nonce.length === 24, 'nonce should have a length of 24')

    // setup with salt passed
    await hoodie2.cryptoStore.setup('test', 'bf11fa9bafca73586e103d60898989d4')
    const saltDoc2 = await hoodie2.store.find('hoodiePluginCryptoStore/salt')

    t.ok(saltDoc2.check.tag.length === 32, 'tag part should have a length of 32')
    t.ok(saltDoc2.check.data.length > 0, 'encrypted data')
    t.ok(saltDoc2.check.nonce.length === 24, 'nonce should have a length of 24')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.setup(password) should throw if a salt doc exists', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  await hoodie.store.add({
    _id: 'hoodiePluginCryptoStore/salt',
    salt: 'bf11fa9bafca73586e103d60898989d4'
  })

  try {
    await hoodie.cryptoStore.setup('test')
    t.fail("setup didn't fail")
  } catch (err) {
    t.equal(err.name, pouchdbErrors.UNAUTHORIZED.name, 'fails with PouchDB unauthorized error')
  }
})

test('cryptoStore.setup(password) should throw if a salt doc exists on remote', async t => {
  t.plan(1)

  const name = uniqueName()
  const remoteDbName = 'remote-' + name
  const remoteDb = new PouchDB(remoteDbName)
  const store = new Store(name, {
    PouchDB: PouchDB,
    remote: remoteDb
  })

  const hoodie = {
    account: {
      on: function () {}
    },
    store: store,
    cryptoStore: new CryptoStore(store)
  }

  await remoteDb.put({
    _id: 'hoodiePluginCryptoStore/salt',
    salt: 'bf11fa9bafca73586e103d60898989d4',
    hoodie: {
      createdAt: new Date().toJSON()
    }
  })

  try {
    await hoodie.cryptoStore.setup('test')
    t.fail("setup didn't fail")
  } catch (err) {
    t.equal(err.name, pouchdbErrors.UNAUTHORIZED.name, 'fails with PouchDB unauthorized error')
  }
})

test('cryptoStore.setup(password) should ignore old salt doc', async t => {
  t.plan(1)

  const name = uniqueName()
  const remoteDbName = 'remote-' + name
  const remoteDb = new PouchDB(remoteDbName)
  const store = new Store(name, {
    PouchDB: PouchDB,
    remote: remoteDb
  })

  const hoodie = {
    account: {
      on: function () {}
    },
    store: store,
    cryptoStore: new CryptoStore(store)
  }

  await remoteDb.put({
    _id: '_design/cryptoStore/salt',
    salt: 'bf11fa9bafca73586e103d60898989d4',
    hoodie: {
      createdAt: new Date().toJSON()
    }
  })

  try {
    await hoodie.cryptoStore.setup('test')
    const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
    t.ok(saltDoc.salt.length > 0, 'it did ignore the old salt doc.')
  } catch (err) {
    t.fail('it should have ignored the old salt doc!')
  }
})

test('cryptoStore.setup(password, salt) should throw if the salt is wrong', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test', 4)
    t.fail('it should have thrown on number as a salt')
  } catch (err) {
    t.equal(err.reason, 'salt must be a 32 char string!', 'should fail on wrong type')
  }

  try {
    await hoodie.cryptoStore.setup('test', 'hello world!')
    t.fail('it should have thrown on string that is to short')
  } catch (err) {
    t.equal(err.reason, 'salt must be a 32 char string!', 'should fail if length !== 32')
  }
})

test('cryptoStore.setup(password) should not unlock', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  await hoodie.cryptoStore.setup('test')

  try {
    await hoodie.cryptoStore.add({
      _id: 'hello',
      test: 2
    })
    t.fail('it did unlock!')
  } catch (err) {
    t.pass("it didn't unlock!")
  }
})

test('cryptoStore.setup(password) should result an array of reset keys', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    const reset = await hoodie.cryptoStore.setup('test')

    t.equal(reset.length, 10, 'there are 10 reset keys')
    t.ok(
      reset.every(key => typeof key === 'string' && key.length === 32),
      'every key has a length of 32'
    )
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.setup(password) should save ten reset docs', async t => {
  t.plan(15)

  const hoodie = createCryptoStore()

  try {
    const keys = await hoodie.cryptoStore.setup('test')

    const docs = await hoodie.store.withIdPrefix('hoodiePluginCryptoStore/pwReset').findAll()

    t.ok(
      docs.every((doc, index) => doc._id === 'hoodiePluginCryptoStore/pwReset_' + index),
      'have correct _id\'s'
    )

    t.ok(
      docs.every(doc => doc.salt.length === 32),
      'have correct salt lengths'
    )

    t.ok(
      docs.every(doc => doc.tag.length === 32),
      'have a tag part with a length of 32'
    )

    t.ok(
      docs.every(doc => doc.data.length > 0),
      'should have encrypted data'
    )

    t.ok(
      docs.every(doc => doc.nonce.length === 24),
      'should have nonce with a length of 24'
    )

    const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
    const key = await createKey('test', saltDoc.salt)

    await Promise.all(docs.map(async (doc, index) => {
      const keyObj = await createKey(keys[index], doc.salt)
      const decrypted = await decrypt(keyObj.key, doc)

      t.equal(decrypted.key, key.key.toString('hex'), 'encrypted data is equal to key')
    }))
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.setup(password) should work with pouchdb-hoodie-api', async t => {
  t.plan(7)

  const { db, cryptoStore } = createPouchCryptoStore()

  try {
    const keys = await cryptoStore.setup('test')
    t.ok(Array.isArray(keys), 'returns keys')

    const docs = await db.allDocs({
      startkey: 'hoodiePluginCryptoStore/pwReset',
      endkey: 'hoodiePluginCryptoStore/pwReset\uffff',
      include_docs: true
    })

    t.is(docs.rows.length, 10, 'did store 10 documents')

    const saltDoc = await db.get('hoodiePluginCryptoStore/salt')
    t.is(typeof saltDoc.salt, 'string', 'salt exists')
    t.is(saltDoc.salt.length, 32, 'salt has correct length')
    t.ok(saltDoc.check.tag.length === 32, 'tag part should have a length of 32')
    t.ok(saltDoc.check.data.length > 0, 'encrypted data')
    t.ok(saltDoc.check.nonce.length === 24, 'nonce should have a length of 24')
  } catch (err) {
    t.end(err)
  }
})

test(
  'cryptoStore.setup(password) with pouchdb-hoodie-api should throw if a salt doc exists',
  async t => {
    t.plan(2)

    const { db, remote, cryptoStore } = createPouchCryptoStore()
    const firstSaltDoc = await db.put({
      _id: 'hoodiePluginCryptoStore/salt',
      salt: 'bf11fa9bafca73586e103d60898989d4'
    })

    try {
      await cryptoStore.setup('test')
      t.fail('it should have failed, because a salt doc exists')
    } catch (err) {
      t.equal(err.name, pouchdbErrors.UNAUTHORIZED.name, 'fails with PouchDB unauthorized error')
    }

    try {
      await db.remove(firstSaltDoc.id, firstSaltDoc.rev)

      await remote.put({
        _id: 'hoodiePluginCryptoStore/salt',
        salt: 'bf11fa9bafca73586e103d60898989d4'
      })

      await cryptoStore.setup('test')
      t.fail('it should have failed, because a salt doc exists on remote')
    } catch (err) {
      t.equal(err.name, pouchdbErrors.UNAUTHORIZED.name, 'fails with PouchDB unauthorized error')
    }
  }
)
