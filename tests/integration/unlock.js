'use strict'

const test = require('tape')
const Store = require('@hoodie/store-client')
const pouchdbErrors = require('pouchdb-errors')

const CryptoStore = require('../../index')
const createCryptoStore = require('../utils/createCryptoStore')
const createPouchCryptoStore = require('../utils/createPouchCryptoStore')
const PouchDB = require('../utils/pouchdb.js')
const uniqueName = require('../utils/unique-name')

test('cryptoStore.unlock(password) should use the saved salt', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.store.add({
      _id: 'hoodiePluginCryptoStore/salt',
      salt: 'bf11fa9bafca73586e103d60898989d4',
      check: {
        nonce: '6e9cf8a4a6eee26f19ff8c70',
        tag: '0d2cfd645fe49b8a29ce22dbbac26b1e',
        data: '5481cf42b7e3f1d15477ed8f1d938bd9fd6103903be6dd4e146f69d9f124e34f33b7fa669305' +
          '57ae6c882cc5f0e23ac4450a8a6653d5aa36ba531667b9cc6874fddf995efc50322bd1bfed19eb086a2ef' +
          'c7732c7cb6f56efd6efe33d273f3e6f538a17d183bc1e9f160d0c080f25a17b863e6904fd0a1c8' +
          'fd918a3bb79655fb1'
      }
    })

    await hoodie.cryptoStore.unlock('test')
    t.pass('does unlock, and not fail')
  } catch (err) {
    t.end(err)
  }
})

test(
  "cryptoStore.unlock(password) should try to pull the salt doc from remote if it doesn't exist",
  async t => {
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

    try {
      await remoteDb.put({
        _id: 'hoodiePluginCryptoStore/salt',
        salt: 'bf11fa9bafca73586e103d60898989d4',
        hoodie: {
          createdAt: new Date().toJSON()
        },
        check: {
          nonce: '6e9cf8a4a6eee26f19ff8c70',
          tag: '0d2cfd645fe49b8a29ce22dbbac26b1e',
          data: '5481cf42b7e3f1d15477ed8f1d938bd9fd6103903be6dd4e146f69d9f124e34f33b7fa669' +
            '30557ae6c882cc5f0e23ac4450a8a6653d5aa36ba531667b9cc6874fddf995efc50322bd1bfed' +
            '19eb086a2efc7732c7cb6f56efd6efe33d273f3e6f538a17d183bc1e9f160d0c080f25a17b863' +
            'e6904fd0a1c8fd918a3bb79655fb1'
        }
      })

      await hoodie.cryptoStore.unlock('test')

      const doc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.equal(doc.salt, 'bf11fa9bafca73586e103d60898989d4', 'salt doc was pulled')
    } catch (err) {
      t.fail(err)
    }
  }
)

test('cryptoStore.unlock(password) should fail if local and remote have no salt doc', async t => {
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

  try {
    await hoodie.cryptoStore.unlock('test')
    t.fail("unlock didn't fail")
  } catch (err) {
    t.equal(err.name, pouchdbErrors.MISSING_DOC.name, 'fails with PouchDBs missing doc error')
  }
})

test('cryptoStore.unlock(password) should ignore the old salt doc', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.store.add({
      _id: '_design/cryptoStore/salt',
      salt: 'bf11fa9bafca73586e103d60898989d4'
    })

    await hoodie.cryptoStore.unlock('test')
    t.fail('it should have ignored the old salt doc!')
  } catch (err) {
    t.equal(err.name, pouchdbErrors.MISSING_DOC.name, 'fails with PouchDBs missing doc error')
  }
})

test('cryptoStore.unlock(password) should fail if the salt is not a 32 char string', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.store.add({
      _id: 'hoodiePluginCryptoStore/salt',
      salt: 'bf11fa9bafca73586e103d60898989',
      hoodie: {
        createdAt: new Date().toJSON()
      },
      check: {
        nonce: '6e9cf8a4a6eee26f19ff8c70',
        tag: '0d2cfd645fe49b8a29ce22dbbac26b1e',
        data: '5481cf42b7e3f1d15477ed8f1d938bd9fd6103903be6dd4e146f69d9f124e34f33b7fa669' +
          '30557ae6c882cc5f0e23ac4450a8a6653d5aa36ba531667b9cc6874fddf995efc50322bd1bfed' +
          '19eb086a2efc7732c7cb6f56efd6efe33d273f3e6f538a17d183bc1e9f160d0c080f25a17b863' +
          'e6904fd0a1c8fd918a3bb79655fb1'
      }
    })

    await hoodie.cryptoStore.unlock('test')

    t.fail('unlock didn\'t fail')
  } catch (err) {
    t.equal(err.status, pouchdbErrors.BAD_ARG.status)
    t.equal(err.reason, 'salt in "hoodiePluginCryptoStore/salt" must be a 32 char string!')
  }
})

test(
  'cryptoStore.unlock(password) should fail if the encrypted check for the password fails',
  async t => {
    t.plan(1)

    const hoodie = createCryptoStore()

    try {
      await hoodie.store.add({
        _id: 'hoodiePluginCryptoStore/salt',
        salt: '5a352fb087036f59242316e1aab1d681',
        check: {
          nonce: '3829ae61881defa450655a43',
          tag: '8f73c2e364c64a6601b8c6bdabaf2dd3',
          data: '9a32bbead59b32adb99b54483e4ea34c7731f90df1eed76c867b77c60c393891d660f' +
            '6cad9433fd4377ad938cf9912139a9f79bfe85d4f144f4a887722571bdeeab25e63b831ab' +
            'c115f61fe4954ceee7d396865643e246048ab6fb1295495a6b55fb53fbfe590cbf7bbec60' +
            '4a1d76259dab0f0c4628c52b25c0ece6412930445'
        }
      })
      await hoodie.cryptoStore.unlock('other-Password')

      t.fail('unlock should have failed')
    } catch (err) {
      t.equal(err.status, pouchdbErrors.UNAUTHORIZED.status, 'should be UNAUTHORIZED')
    }
  }
)

test('cryptoStore.unlock(password) should fail if it did already unlock', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')
    await hoodie.cryptoStore.unlock('test')

    t.fail('unlock should have failed on second unlock')
  } catch (err) {
    t.equal(err.status, pouchdbErrors.INVALID_REQUEST.status, 'should be an INVALID_REQUEST')
    t.equal(err.reason, 'store is already unlocked!', 'With the correct error message')
  }
})

test(
  'cryptoStore.unlock(password) should add checks to salt doc after first encrypted doc' +
    ' was read with find',
  async t => {
    t.plan(4)

    const hoodie = createCryptoStore()

    try {
      await hoodie.store.add([
        {
          _id: 'hoodiePluginCryptoStore/salt',
          salt: 'bf11fa9bafca73586e103d60898989d4'
        },
        {
          _id: 'test-doc',
          tag: '1d9fb919ebecfe3c207781d103164a7f',
          data: 'e6dc77a9451e3c91113ba19ead4c4045',
          nonce: 'e1cb5518678d08619697d6f7'
        }
      ])
      await hoodie.cryptoStore.unlock('test')

      const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.notOk(saltDoc.check, 'salt doc shouldn\'t have the check object')

      await hoodie.cryptoStore.find('test-doc')

      const updatedSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.ok(updatedSaltDoc.check.tag.length === 32, 'tag part should have a length of 32')
      t.ok(updatedSaltDoc.check.data.length > 0, 'encrypted data')
      t.ok(updatedSaltDoc.check.nonce.length === 24, 'nonce should have a length of 24')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.unlock(password) should add checks to moved old salt doc after first encrypted doc' +
    ' was read with findAll',
  async t => {
    t.plan(4)

    const hoodie = createCryptoStore()

    try {
      await hoodie.store.add([
        {
          _id: 'hoodiePluginCryptoStore/salt',
          salt: 'bf11fa9bafca73586e103d60898989d4'
        },
        {
          _id: 'test-doc',
          tag: '1d9fb919ebecfe3c207781d103164a7f',
          data: 'e6dc77a9451e3c91113ba19ead4c4045',
          nonce: 'e1cb5518678d08619697d6f7'
        }
      ])

      await hoodie.cryptoStore.unlock('test')
      const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.notOk(saltDoc.check, 'salt doc shouldn\'t have the check object')

      await hoodie.cryptoStore.findAll()

      const updatedSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.ok(updatedSaltDoc.check.tag.length === 32, 'tag part should have a length of 32')
      t.ok(updatedSaltDoc.check.data.length > 0, 'encrypted data')
      t.ok(updatedSaltDoc.check.nonce.length === 24, 'nonce should have a length of 24')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.unlock(password) should add checks to moved old salt doc after first encrypted doc' +
    ' was read with findOrAdd',
  async t => {
    t.plan(4)

    const hoodie = createCryptoStore()

    try {
      await hoodie.store.add([
        {
          _id: 'hoodiePluginCryptoStore/salt',
          salt: 'bf11fa9bafca73586e103d60898989d4'
        },
        {
          _id: 'test-doc',
          tag: '1d9fb919ebecfe3c207781d103164a7f',
          data: 'e6dc77a9451e3c91113ba19ead4c4045',
          nonce: 'e1cb5518678d08619697d6f7'
        }
      ])
      await hoodie.cryptoStore.unlock('test')

      const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.notOk(saltDoc.check, 'salt doc shouldn\'t have the check object')

      await hoodie.cryptoStore.findOrAdd('test-doc', { otherValue: 2 })

      const updatedSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.ok(updatedSaltDoc.check.tag.length === 32, 'tag part should have a length of 32')
      t.ok(updatedSaltDoc.check.data.length > 0, 'encrypted data')
      t.ok(updatedSaltDoc.check.nonce.length === 24, 'nonce should have a length of 24')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.unlock(password) should add checks to moved old salt doc after first encrypted doc' +
    ' was read with update',
  async t => {
    t.plan(4)

    const hoodie = createCryptoStore()

    try {
      await hoodie.store.add([
        {
          _id: 'hoodiePluginCryptoStore/salt',
          salt: 'bf11fa9bafca73586e103d60898989d4'
        },
        {
          _id: 'test-doc',
          tag: '1d9fb919ebecfe3c207781d103164a7f',
          data: 'e6dc77a9451e3c91113ba19ead4c4045',
          nonce: 'e1cb5518678d08619697d6f7'
        }
      ])
      await hoodie.cryptoStore.unlock('test')

      const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.notOk(saltDoc.check, 'salt doc shouldn\'t have the check object')

      await hoodie.cryptoStore.update('test-doc', { otherValue: 2 })

      const updatedSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.ok(updatedSaltDoc.check.tag.length === 32, 'tag part should have a length of 32')
      t.ok(updatedSaltDoc.check.data.length > 0, 'encrypted data')
      t.ok(updatedSaltDoc.check.nonce.length === 24, 'nonce should have a length of 24')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.unlock(password) should add checks to moved old salt doc after first encrypted doc' +
    ' was read with updateOrAdd',
  async t => {
    t.plan(4)

    const hoodie = createCryptoStore()

    try {
      await hoodie.store.add([
        {
          _id: 'hoodiePluginCryptoStore/salt',
          salt: 'bf11fa9bafca73586e103d60898989d4'
        },
        {
          _id: 'test-doc',
          tag: '1d9fb919ebecfe3c207781d103164a7f',
          data: 'e6dc77a9451e3c91113ba19ead4c4045',
          nonce: 'e1cb5518678d08619697d6f7'
        }
      ])
      await hoodie.cryptoStore.unlock('test')

      const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.notOk(saltDoc.check, 'salt doc shouldn\'t have the check object')

      await hoodie.cryptoStore.updateOrAdd('test-doc', { otherValue: 2 })

      const updatedSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.ok(updatedSaltDoc.check.tag.length === 32, 'tag part should have a length of 32')
      t.ok(updatedSaltDoc.check.data.length > 0, 'encrypted data')
      t.ok(updatedSaltDoc.check.nonce.length === 24, 'nonce should have a length of 24')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.unlock(password) should add checks to moved old salt doc after first encrypted doc' +
    ' was read with updateAll',
  async t => {
    t.plan(4)

    const hoodie = createCryptoStore()

    try {
      await hoodie.store.add([
        {
          _id: 'hoodiePluginCryptoStore/salt',
          salt: 'bf11fa9bafca73586e103d60898989d4'
        },
        {
          _id: 'test-doc',
          tag: '1d9fb919ebecfe3c207781d103164a7f',
          data: 'e6dc77a9451e3c91113ba19ead4c4045',
          nonce: 'e1cb5518678d08619697d6f7'
        }
      ])
      await hoodie.cryptoStore.unlock('test')

      const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.notOk(saltDoc.check, 'salt doc shouldn\'t have the check object')

      await hoodie.cryptoStore.updateAll({ otherValue: 2 })

      const updatedSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.ok(updatedSaltDoc.check.tag.length === 32, 'tag part should have a length of 32')
      t.ok(updatedSaltDoc.check.data.length > 0, 'encrypted data')
      t.ok(updatedSaltDoc.check.nonce.length === 24, 'nonce should have a length of 24')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.unlock(password) should add checks to moved old salt doc after first encrypted doc' +
    ' was read with remove',
  async t => {
    t.plan(4)

    const hoodie = createCryptoStore()

    try {
      await hoodie.store.add([
        {
          _id: 'hoodiePluginCryptoStore/salt',
          salt: 'bf11fa9bafca73586e103d60898989d4'
        },
        {
          _id: 'test-doc',
          tag: '1d9fb919ebecfe3c207781d103164a7f',
          data: 'e6dc77a9451e3c91113ba19ead4c4045',
          nonce: 'e1cb5518678d08619697d6f7'
        }
      ])
      await hoodie.cryptoStore.unlock('test')

      const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.notOk(saltDoc.check, 'salt doc shouldn\'t have the check object')

      await hoodie.cryptoStore.remove('test-doc', { otherValue: 2 })

      const updatedSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.ok(updatedSaltDoc.check.tag.length === 32, 'tag part should have a length of 32')
      t.ok(updatedSaltDoc.check.data.length > 0, 'encrypted data')
      t.ok(updatedSaltDoc.check.nonce.length === 24, 'nonce should have a length of 24')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.unlock(password) should add checks to moved old salt doc after first encrypted doc' +
    ' was read with removeAll',
  async t => {
    t.plan(4)

    const hoodie = createCryptoStore()

    try {
      await hoodie.store.add([
        {
          _id: 'hoodiePluginCryptoStore/salt',
          salt: 'bf11fa9bafca73586e103d60898989d4'
        },
        {
          _id: 'test-doc',
          tag: '1d9fb919ebecfe3c207781d103164a7f',
          data: 'e6dc77a9451e3c91113ba19ead4c4045',
          nonce: 'e1cb5518678d08619697d6f7'
        }
      ])
      await hoodie.cryptoStore.unlock('test')

      const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.notOk(saltDoc.check, 'salt doc shouldn\'t have the check object')

      await hoodie.cryptoStore.removeAll({ otherValue: 2 })

      const updatedSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.ok(updatedSaltDoc.check.tag.length === 32, 'tag part should have a length of 32')
      t.ok(updatedSaltDoc.check.data.length > 0, 'encrypted data')
      t.ok(updatedSaltDoc.check.nonce.length === 24, 'nonce should have a length of 24')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.withPassword() should not case a check to be added to the moved saltDoc',
  async t => {
    t.plan(1)

    const hoodie = createCryptoStore()

    try {
      await hoodie.store.add([
        {
          _id: 'hoodiePluginCryptoStore/salt',
          salt: 'bf11fa9bafca73586e103d60898989d4'
        },
        {
          _id: 'test-doc',
          tag: 'b2917d9e4e2954bef59ce09a0805b05c',
          data: '4ff14f46992d2f473288ef',
          nonce: '49c61c84248eb6c0e6cda510'
        }
      ])
      await hoodie.cryptoStore.unlock('test')

      const { store } = await hoodie.cryptoStore.withPassword(
        'other',
        '495d3b6a06b27512b47bc426150866b3'
      )

      await store.find('test-doc')

      const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.notOk(saltDoc.check, 'salt doc shouldn\'t have the check object')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.unlock(password) should not add checks if the option "noPasswordAutoFix" was set',
  async t => {
    t.plan(2)

    const hoodie = createCryptoStore({ noPasswordCheckAutoFix: true })

    try {
      hoodie.store.add([
        {
          _id: 'hoodiePluginCryptoStore/salt',
          salt: 'bf11fa9bafca73586e103d60898989d4'
        },
        {
          _id: 'test-doc',
          tag: '1d9fb919ebecfe3c207781d103164a7f',
          data: 'e6dc77a9451e3c91113ba19ead4c4045',
          nonce: 'e1cb5518678d08619697d6f7'
        }
      ])
      await hoodie.cryptoStore.unlock('test')

      const saltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.notOk(saltDoc.check, 'salt doc shouldn\'t have the check object')

      await hoodie.cryptoStore.find('test-doc')

      const updatedSaltDoc = await hoodie.store.find('hoodiePluginCryptoStore/salt')
      t.notOk(updatedSaltDoc.check, "salt doc shouldn't have the check object")
    } catch (err) {
      t.end(err)
    }
  }
)

test('cryptoStore.setup(password) with pouchdb-hoodie-api should unlock', async t => {
  t.plan(1)

  const { db, cryptoStore } = createPouchCryptoStore()

  try {
    await db.put({
      _id: 'hoodiePluginCryptoStore/salt',
      salt: 'bf11fa9bafca73586e103d60898989d4',
      check: {
        nonce: '6e9cf8a4a6eee26f19ff8c70',
        tag: '0d2cfd645fe49b8a29ce22dbbac26b1e',
        data: '5481cf42b7e3f1d15477ed8f1d938bd9fd6103903be6dd4e146f69d9f124e34f33b7fa669305' +
          '57ae6c882cc5f0e23ac4450a8a6653d5aa36ba531667b9cc6874fddf995efc50322bd1bfed19eb086a2ef' +
          'c7732c7cb6f56efd6efe33d273f3e6f538a17d183bc1e9f160d0c080f25a17b863e6904fd0a1c8' +
          'fd918a3bb79655fb1'
      }
    })

    await cryptoStore.unlock()
    t.pass('does unlock, and not fail')
  } catch (err) {
    t.end(err)
  }
})

test(
  'cryptoStore.setup(password) with pouchdb-hoodie-api should unlock with salt doc on remote',
  async t => {
    t.plan(1)

    const { remote, cryptoStore } = createPouchCryptoStore()

    try {
      await remote.put({
        _id: 'hoodiePluginCryptoStore/salt',
        salt: 'bf11fa9bafca73586e103d60898989d4',
        check: {
          nonce: '6e9cf8a4a6eee26f19ff8c70',
          tag: '0d2cfd645fe49b8a29ce22dbbac26b1e',
          data: '5481cf42b7e3f1d15477ed8f1d938bd9fd6103903be6dd4e146f69d9f124e34f33b7fa669305' +
            '57ae6c882cc5f0e23ac4450a8a6653d5aa36ba531667b9cc6874fddf995efc50322bd1bfed19eb08' +
            '6a2efc7732c7cb6f56efd6efe33d273f3e6f538a17d183bc1e9f160d0c080f25a17b863e6904fd0a' +
            '1c8fd918a3bb79655fb1'
        }
      })

      await cryptoStore.unlock()
      t.pass('does unlock, and not fail')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.setup(password) with pouchdb-hoodie-api should fail if salt doc does not exist',
  async t => {
    t.plan(1)

    const { cryptoStore } = createPouchCryptoStore()

    try {
      await cryptoStore.unlock()
      t.fail("unlock didn't fail")
    } catch (err) {
      t.equal(err.name, pouchdbErrors.MISSING_DOC.name, 'fails with PouchDBs missing doc error')
    }
  }
)

test(
  'cryptoStore.setup(password) with pouchdb-hoodie-api should work without a remote db',
  async t => {
    t.plan(1)

    const { db, cryptoStore } = createPouchCryptoStore({ remote: null })

    try {
      await db.put({
        _id: 'hoodiePluginCryptoStore/salt',
        salt: 'bf11fa9bafca73586e103d60898989d4',
        check: {
          nonce: '6e9cf8a4a6eee26f19ff8c70',
          tag: '0d2cfd645fe49b8a29ce22dbbac26b1e',
          data: '5481cf42b7e3f1d15477ed8f1d938bd9fd6103903be6dd4e146f69d9f124e34f33b7fa669305' +
            '57ae6c882cc5f0e23ac4450a8a6653d5aa36ba531667b9cc6874fddf995efc50322bd1bfed19eb08' +
            '6a2efc7732c7cb6f56efd6efe33d273f3e6f538a17d183bc1e9f160d0c080f25a17b863e6904fd0a' +
            '1c8fd918a3bb79655fb1'
        }
      })

      await cryptoStore.unlock()
      t.pass('does unlock, and not fail')
    } catch (err) {
      t.end(err)
    }
  }
)

test(
  'cryptoStore.setup(password) with pouchdb-hoodie-api should fail without remote db and local salt',
  async t => {
    t.plan(1)

    const { cryptoStore } = createPouchCryptoStore({ remote: null })

    try {
      await cryptoStore.unlock()
      t.fail("unlock didn't fail")
    } catch (err) {
      t.equal(err.name, pouchdbErrors.MISSING_DOC.name, 'fails with PouchDBs missing doc error')
    }
  }
)
