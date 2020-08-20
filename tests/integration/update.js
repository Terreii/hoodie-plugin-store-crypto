'use strict'

/*
 * Testing the cryptoStore.update method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')
const checkTime = require('../utils/checkTime')

test('cryptoStore.update(id, changedProperties)', async t => {
  t.plan(10)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.store.add({ _id: 'exists', foo: 'bar' })

    const object = await hoodie.cryptoStore.update('exists', { foo: 'baz' })
    // encrypt existing not encrypted object
    t.ok(object._id)
    t.ok(/^2-/.test(object._rev), 'revision is 2')
    t.is(object.foo, 'baz', 'passes properties')

    const updated = await hoodie.cryptoStore.update('exists', { foo: 'foo' })
    // update existing encrypted object
    t.ok(updated._id)
    t.ok(/^3-/.test(updated._rev), 'revision is 3')
    t.is(updated.foo, 'foo', 'passes properties')

    const obj = await hoodie.store.find('exists')
    // object got encrypted
    t.is(obj.foo, undefined, 'stored doc has no foo')
    t.ok(obj.data, 'has encrypted data')
    t.ok(obj.tag, 'has tag')
    t.ok(obj.nonce, 'has nonce')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.update(id)', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.update('nothinghere')
    t.fail("update didn't fail")
  } catch (err) {
    t.ok(err instanceof Error, 'rejects error')
  }
})

test(
  'cryptoStore.update("unknown", changedProperties) returns custom not found error',
  async t => {
    t.plan(3)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      await hoodie.cryptoStore.update('unknown', { foo: 'bar' })
      t.fail("update didn't fail")
    } catch (err) {
      t.ok(err instanceof Error, 'rejects error')
      t.is(err.name, 'Not found', 'rejects with custom name')
      t.is(err.message, 'Object with id "unknown" is missing', 'rejects with custom message')
    } finally {
      t.end()
    }
  }
)

test('cryptoStore.update(id, updateFunction)', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'exists' })

    const object = await hoodie.cryptoStore.update('exists', function (object) {
      object.foo = object._id + 'bar'
    })

    t.ok(object._id)
    t.ok(/^2-/.test(object._rev))
    t.is(object.foo, 'existsbar', 'resolves properties')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.update(object)', async t => {
  t.plan(10)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.store.add({ _id: 'exists', foo: 'bar' })

    const object = await hoodie.cryptoStore.update({ _id: 'exists', foo: 'baz' })

    // encrypt existing not encrypted object
    t.ok(object._id)
    t.ok(/^2-/.test(object._rev), 'revision is 2')
    t.is(object.foo, 'baz', 'passes properties')

    const updated = await hoodie.cryptoStore.update({ _id: 'exists', foo: 'foo' })

    // update existing encrypted object
    t.ok(updated._id)
    t.ok(/^3-/.test(updated._rev), 'revision is 3')
    t.is(updated.foo, 'foo', 'passes properties')

    const encrypted = await hoodie.store.find('exists')
    // object is encrypted
    t.is(encrypted.foo, undefined, 'stored doc has no foo')
    t.ok(encrypted.data, 'has encrypted data')
    t.ok(encrypted.tag, 'has tag')
    t.ok(encrypted.nonce, 'has nonce')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.update(array)', async t => {
  t.plan(14)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'bar', bar: 'foo' })
    await hoodie.store.add({ _id: 'notEncrypted', foo: 'bar' })

    const objects = await hoodie.cryptoStore.update([
      { _id: 'encrypted', bar: 'baz' },
      { _id: 'notEncrypted', bar: 'baz' }
    ])

    t.is(objects[0]._id, 'encrypted')
    t.is(objects[0].foo, 'bar')
    t.is(objects[0].bar, 'baz')

    t.is(objects[1]._id, 'notEncrypted')
    t.is(objects[1].foo, 'bar')
    t.is(objects[1].bar, 'baz')

    const encrypted = await hoodie.store.find(['encrypted', 'notEncrypted'])

    t.is(encrypted[0].foo, undefined, 'stored doc has no foo')
    t.ok(encrypted[0].data, 'has encrypted data')
    t.ok(encrypted[0].tag, 'has tag')
    t.ok(encrypted[0].nonce, 'has nonce')

    t.is(encrypted[1].foo, undefined, 'stored doc has no foo')
    t.ok(encrypted[1].data, 'has encrypted data')
    t.ok(encrypted[1].tag, 'has tag')
    t.ok(encrypted[1].nonce, 'has nonce')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.update(array) with non-existent and invalid objects', async t => {
  t.plan(8)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: 'exists' },
      { _id: 'foo' }
    ])

    const objects = await hoodie.cryptoStore.update([
      { _id: 'exists', foo: 'bar' },
      { _id: 'unknown', foo: 'baz' },
      'foo',
      []
    ])

    t.is(objects[0]._id, 'exists')
    t.is(objects[0].foo, 'bar')
    t.is(parseInt(objects[0]._rev, 10), 2)

    t.is(objects[1].status, 404)
    t.is(objects[1].name, 'Not found', 'rejects with custom name for unknown')
    t.is(
      objects[1].message,
      'Object with id "unknown" is missing',
      'rejects with custom message for unknown'
    )

    t.is(objects[2].status, 400)
    t.is(objects[3].status, 404)
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.update(array, changedProperties)', async t => {
  t.plan(12)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'foo', bar: 'foo' })
    await hoodie.store.add({ _id: 'notEncrypted', foo: 'bar' })

    const objects = await hoodie.cryptoStore.update(
      [
        { _id: 'encrypted' },
        'notEncrypted',
        'unknown'
      ],
      { bar: 'baz' }
    )

    t.is(objects[0]._id, 'encrypted')
    t.is(objects[0].foo, 'foo')
    t.is(objects[0].bar, 'baz')
    t.is(parseInt(objects[0]._rev, 10), 2)

    t.is(objects[1]._id, 'notEncrypted')
    t.is(objects[1].foo, 'bar')
    t.is(objects[1].bar, 'baz')

    t.is(objects[2].status, 404)

    const encrypted = await hoodie.store.find('notEncrypted')
    t.is(encrypted.foo, undefined, 'stored doc has no foo')
    t.ok(encrypted.data, 'has encrypted data')
    t.ok(encrypted.tag, 'has tag')
    t.ok(encrypted.nonce, 'has nonce')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.update(array, updateFunction)', async t => {
  t.plan(6)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'encrypted', foo: 'foo', bar: 'foo' })
    await hoodie.store.add({ _id: 'notEncrypted', foo: 'bar' })

    const objects = await hoodie.cryptoStore.update(['encrypted', 'notEncrypted'], function (doc) {
      doc.bar = doc._id + 'baz'
    })

    t.is(objects[0]._id, 'encrypted', "_id isn't changed")
    t.is(objects[0].foo, 'foo', "other field wasn't changed")
    t.is(objects[0].bar, 'encryptedbaz', 'bar did update')

    t.is(objects[1]._id, 'notEncrypted', "_id isn't changed")
    t.is(objects[1].foo, 'bar', "other field wasn't changed")
    t.is(objects[1].bar, 'notEncryptedbaz', 'bar did update')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.update(object) updates updatedAt timestamp', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  let startTime = null

  hoodie.store.on('update', object => {
    t.is(object._id, 'shouldHaveTimestamps', 'resolves doc')
    t.is(typeof object.hoodie.deletedAt, 'undefined', 'deletedAt shouldnt be set')
    t.ok(
      checkTime(startTime, object.hoodie.updatedAt),
      'updatedAt should be the same time as right now'
    )
    t.not(object.hoodie.createdAt, object.hoodie.updatedAt, 'createdAt and updatedAt should not be the same')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'shouldHaveTimestamps' })

    await new Promise(resolve => {
      setTimeout(resolve, 1000)
    })

    startTime = new Date()
    await hoodie.cryptoStore.update({
      _id: 'shouldHaveTimestamps',
      foo: 'bar'
    })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.update([objects]) updates updatedAt timestamps', async t => {
  t.plan(8)

  const hoodie = createCryptoStore()

  let startTime = null

  hoodie.store.on('update', object => {
    t.ok(object._id, 'resolves doc')
    t.is(typeof object.hoodie.deletedAt, 'undefined', 'deletedAt shouldnt be set')
    t.ok(
      checkTime(startTime, object.hoodie.updatedAt),
      'updatedAt should be the same time as right now'
    )
    t.not(object.hoodie.createdAt, object.hoodie.updatedAt, 'createdAt and updatedAt should not be the same')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'encrypted' })
    await hoodie.store.add({ _id: 'notEncrypted' })

    await new Promise(resolve => {
      setTimeout(resolve, 1000)
    })

    startTime = new Date()
    await hoodie.cryptoStore.update(['encrypted', 'notEncrypted'], { foo: 'bar' })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.update(object) ignores .hoodie property', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'exists' })

    const object = await hoodie.cryptoStore.update({
      _id: 'exists',
      foo: 'bar',
      hoodie: { ignore: 'me' }
    })

    t.ok(object._id, 'resolves with id')
    t.ok(/^2-/.test(object._rev), 'resolves with new rev number')
    t.is(object.foo, 'bar', 'resolves with properties')
    t.is(object.hoodie.ignore, undefined, 'ignores .hoodie property')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.update(array)', async t => {
  t.plan(7)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: '1', foo: 'foo', bar: 'foo' },
      { _id: '2', foo: 'bar' }
    ])

    const objects = await hoodie.cryptoStore.update([
      { _id: '1', bar: 'baz', hoodie: { ignore: 'me' } },
      { _id: '2', bar: 'baz' }
    ])

    t.is(objects[0]._id, '1')
    t.is(objects[0].foo, 'foo')
    t.is(objects[0].bar, 'baz')
    t.is(objects[0].hoodie.ignore, undefined)

    t.is(objects[1]._id, '2')
    t.is(objects[1].foo, 'bar')
    t.is(objects[1].bar, 'baz')
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.update() shouldn't encrypt fields in cy_ignore and __cy_ignore", async t => {
  t.plan(9)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const obj = await hoodie.cryptoStore.add({
      value: 42,
      notEncrypted: 'other',
      notEncryptedTemp: true,
      cy_ignore: ['notEncrypted'],
      __cy_ignore: ['notEncryptedTemp']
    })

    const updated = await hoodie.cryptoStore.update(obj._id, {
      other: 789,
      __cy_ignore: ['value']
    })

    t.is(updated.value, 42, 'value exists')
    t.is(updated.other, 789, 'later added value exists')
    t.is(updated.notEncrypted, 'other', 'notEncrypted value as merged')
    t.is(updated.notEncryptedTemp, true, 'notEncryptedTemp exists')

    t.deepEqual(updated.cy_ignore, ['notEncrypted'], 'cy_ignore was saved')
    t.is(updated.__cy_ignore, undefined, '__cy_ignore was not saved')

    const encrypted = await hoodie.store.find(updated._id)
    t.is(encrypted.value, 42, 'encrypted value listed in __cy_ignore was decrypted')
    t.is(encrypted.notEncryptedTemp, undefined, 'not encrypted value was encrypted and deleted')
    t.is(encrypted.other, undefined, 'later added value was saved encrypted')
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.update() shouldn't encrypt fields starting with _", async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const obj = await hoodie.cryptoStore.add({ value: 42 })
    await hoodie.cryptoStore.update(obj._id, {
      _other: 'test value'
    })

    t.fail(new Error('should have thrown with doc_validation'))
  } catch (err) {
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }
})

test("cryptoStore.update() should throw if plugin isn't unlocked", async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.update('anId', { value: 'something' })
    t.fail('It should have thrown')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  try {
    await hoodie.cryptoStore.setup('test')

    await hoodie.cryptoStore.update('anId', { value: 'something' })
    t.fail('It should have thrown after setup')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  t.end()
})
