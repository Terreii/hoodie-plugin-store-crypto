'use strict'

/*
 * Testing the cryptoStore.remove method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

const test = require('tape')
const pouchdbErrors = require('pouchdb-errors')

const createCryptoStore = require('../utils/createCryptoStore')
const checkTime = require('../utils/checkTime')

test('removes existing by id', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'foo',
      bar: 'baz'
    })

    const object = await hoodie.cryptoStore.remove('foo')
    t.is(object._id, 'foo', 'resolves value')
    t.is(object.bar, 'baz', 'resolves value')

    await hoodie.cryptoStore.find('foo')
    t.fail("find didn't fail")
  } catch (error) {
    t.ok(error instanceof Error, 'rejects error')
  }
})

test('removes existing by object', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'foo',
      bar: 'baz'
    })

    const object = await hoodie.cryptoStore.remove({ _id: 'foo' })
    t.is(object._id, 'foo', 'resolves value')
    t.is(object.bar, 'baz', 'resolves value')

    await hoodie.cryptoStore.find('foo')
    t.fail("find didn't fail")
  } catch (error) {
    t.ok(error instanceof Error, 'rejects error')
  }
})

test('fails for non-existing', async t => {
  t.plan(6)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.remove('foo')
    t.fail("find didn't fail")
  } catch (error) {
    t.ok(error instanceof Error, 'rejects error')
    t.is(error.name, 'Not found', 'rejects with custom name')
    t.is(error.message, 'Object with id "foo" is missing', 'rejects with custom message')
  }

  try {
    await hoodie.cryptoStore.remove({ _id: 'foo' })
    t.fail("find didn't fail")
  } catch (error) {
    t.ok(error instanceof Error, 'rejects error')
    t.is(error.name, 'Not found', 'rejects with custom name')
    t.is(error.message, 'Object with id "foo" is missing', 'rejects with custom message')
  }

  t.end()
})

test('cryptoStore.remove(array) removes existing, returns error for non-existing', async t => {
  t.plan(9)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: 'exists1', foo: 'bar' },
      { _id: 'exists2', foo: 'baz' }
    ])

    const objects = await hoodie.cryptoStore.remove([
      'exists1',
      { _id: 'exists2' },
      'unknown'
    ])

    t.is(objects[0]._id, 'exists1', 'resolves with value for existing')
    t.is(objects[0].foo, 'bar', 'resolves with value for existing')
    t.is(parseInt(objects[0]._rev, 10), 2, 'resolves with revision 2')

    t.is(objects[1]._id, 'exists2', 'resolves with value for existing')
    t.is(objects[1].foo, 'baz', 'resolves with value for existing')
    t.is(parseInt(objects[1]._rev, 10), 2, 'resolves with revision 2')

    t.is(objects[2].status, 404, 'resolves with 404 error for non-existing')
    t.is(objects[2].name, 'Not found', 'rejects with custom name for unknown')
    t.is(
      objects[2].message,
      'Object with id "unknown" is missing',
      'rejects with custom message for unknown'
    )
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.remove([changedObjects]) updates before removing', async t => {
  t.plan(5)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      {
        _id: 'foo',
        foo: 'bar'
      },
      {
        _id: 'bar',
        foo: 'foo'
      }
    ])

    const objects = await hoodie.cryptoStore.remove([
      {
        _id: 'foo',
        foo: 'changed',
        hoodie: { ignore: 'me' }
      },
      {
        _id: 'bar',
        foo: 'changed'
      }
    ])

    t.is(objects[0]._id, 'foo', 'resolves value')
    t.is(objects[0].foo, 'changed', 'check foo is changed')
    t.is(objects[0].hoodie.ignore, undefined, 'ignores hoodie property')
    t.is(objects[1]._id, 'bar', 'resolves value')
    t.is(objects[1].foo, 'changed', 'check foo is changed')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.remove(changedObject) updates before removing', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'foo',
      foo: 'bar'
    })

    const object = await hoodie.cryptoStore.remove({
      _id: 'foo',
      foo: 'changed',
      hoodie: { ignore: 'me' }
    })

    t.is(object._id, 'foo', 'resolves value')
    t.is(object.foo, 'changed', 'check foo is changed')
    t.is(object.hoodie.ignore, undefined, 'ignores hoodie property')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.remove(id, changedProperties) updates before removing', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'foo',
      foo: 'bar'
    })

    const object = await hoodie.cryptoStore.remove('foo', {
      foo: 'changed',
      hoodie: { ignore: 'me' }
    })

    t.is(object._id, 'foo', 'resolves value')
    t.is(object.foo, 'changed', 'check foo is changed')
    t.is(object.hoodie.ignore, undefined, 'ignores hoodie property')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.remove(id, changeFunction) updates before removing', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'foo',
      foo: 'bar'
    })

    const object = await hoodie.cryptoStore.remove('foo', function (doc) {
      doc.foo = 'changed'
      doc.hoodie.ignore = 'me'
      return doc
    })

    t.is(object._id, 'foo', 'resolves value')
    t.is(object.foo, 'changed', 'check foo is changed')
    t.is(object.hoodie.ignore, undefined, 'ignores hoodie property')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.remove(object) creates deletedAt timestamp', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'foo',
      foo: 'bar'
    })

    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    const startTime = new Date()
    const object = await hoodie.cryptoStore.remove('foo')

    t.is(object._id, 'foo', 'resolves doc')
    t.ok(object.hoodie.deletedAt, 'should have deleteAt timestamps')
    t.ok(
      checkTime(startTime, object.hoodie.deletedAt),
      'deletedAt should be a valid date of right now'
    )
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.remove([objects]) creates deletedAt timestamps', async t => {
  t.plan(10)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      {
        _id: 'foo',
        foo: 'bar'
      },
      {
        _id: 'bar',
        foo: 'foo'
      }
    ])

    const startTime = new Date()
    const objects = await hoodie.cryptoStore.remove(['foo', 'bar'])

    t.is(objects[0]._id, 'foo', 'resolves doc')
    t.is(objects[1]._id, 'bar', 'resolves doc')

    objects.forEach(object => {
      t.ok(object.hoodie.createdAt, 'should have createdAt timestamp')
      t.ok(object.hoodie.updatedAt, 'should have updatedAt timestamp')
      t.ok(object.hoodie.deletedAt, 'should have deleteAt timestamp')
      t.ok(
        checkTime(startTime, object.hoodie.deletedAt),
        'deletedAt should be a valid date of right now'
      )
    })
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.remove() shouldn't encrypt fields in cy_ignore and __cy_ignore", async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  hoodie.store.on('remove', obj => {
    t.is(obj.value, 42, 'field listed in __cy_ignore was decrypted')
    t.is(obj.notEncrypted, 'other', 'field listed is cy_ignore was not encrypted')
    t.is(obj.notEncryptedTemp, undefined, 'not encrypted fields got encrypted and removed')
  })

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

    await hoodie.cryptoStore.remove(obj._id, {
      __cy_ignore: ['value']
    })
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore.remove() shouldn't encrypt fields starting with _", async t => {
  t.plan(4)

  const hoodie = createCryptoStore()
  const hoodie2 = createCryptoStore({ notHandleSpecialDocumentMembers: true })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const obj = await hoodie.cryptoStore.add({ value: 42 })

    await hoodie.cryptoStore.remove(obj._id, {
      _other: 'test value'
    })
    t.fail(new Error('should have thrown with doc_validation'))
  } catch (err) {
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }

  hoodie2.store.on('remove', obj => {
    t.is(obj.value, undefined, 'members still get encrypted')
    t.is(obj._other, undefined, 'members starting with _ are encrypted')
  })

  try {
    await hoodie2.cryptoStore.setup('test')
    await hoodie2.cryptoStore.unlock('test')

    const obj = await hoodie2.cryptoStore.add({ value: 42 })

    const updated = await hoodie2.cryptoStore.remove(obj._id, {
      _other: 'test value'
    })
    t.is(updated._other, 'test value', 'values starting with _ are added')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.remove() should throw if plugin isn\'t unlocked', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.remove('anId')
    t.fail('It should have thrown')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.remove('anId')
    t.fail('It should have thrown after setup')
  } catch (err) {
    t.equal(err.status, 401, 'uses PouchDB UNAUTHORIZED status')
    t.equal(err.message, pouchdbErrors.UNAUTHORIZED.message)
  }

  t.end()
})
