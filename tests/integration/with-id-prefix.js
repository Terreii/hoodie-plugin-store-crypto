'use strict'

/*
 * Testing the cryptoStore.withIdPrefix method.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

const test = require('tape')

const createCryptoStore = require('../utils/createCryptoStore')

test('cryptoStore.withIdPrefix() exists', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.withIdPrefix, 'function', 'has method')
})

test('cryptoStore.withIdPrefix("test/") returns scoped methods', t => {
  t.plan(13)

  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  ;[
    'add',
    'find',
    'findAll',
    'findOrAdd',
    'update',
    'updateOrAdd',
    'updateAll',
    'remove',
    'removeAll',
    'withIdPrefix',
    'on',
    'one',
    'off'
  ].forEach(key => {
    t.is(typeof cryptoStore[key], 'function', 'has method: ' + key)
  })
})

test('cryptoStore.withIdPrefix("test/").add(properties)', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const object = await cryptoStore.add({ foo: 'bar' })

    t.ok(object._id.startsWith('test/'), 'prefixes id with "test/"')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.withIdPrefix("test/").add([doc1, doc2])', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const objects = await cryptoStore.add([
      { foo: 'bar' },
      { baz: 'bar' }
    ])

    t.ok(objects[0]._id.startsWith('test/'), 'prefixes id with "test/"')
    t.ok(objects[1]._id.startsWith('test/'), 'prefixes id with "test/"')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.withIdPrefix("test/").find("foo")', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'test/foo',
      bar: 'baz'
    })

    await cryptoStore.find('foo')

    t.pass('finds doc')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").find("test/foo")', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'test/foo',
      bar: 'baz'
    })

    await cryptoStore.find('test/foo')

    t.pass('finds doc')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").find(["foo", "test/bar"])', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: 'test/foo' },
      { _id: 'test/bar' }
    ])
    await hoodie.store.add({
      _id: 'test/baz'
    })

    const objects = await cryptoStore.find(['foo', 'test/bar', 'baz'])

    t.is(objects[0]._id, 'test/foo', 'finds doc with _id: test/foo')
    t.is(objects[1]._id, 'test/bar', 'finds doc with _id: test/bar')
    t.is(objects[2]._id, 'test/baz', 'finds doc with _id: test/baz')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.withIdPrefix("test/").findOrAdd(id, object) when found', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'test/foo',
      foo: 'bar'
    })

    const doc = await cryptoStore.findOrAdd('foo', { foo: 'baz' })

    t.is(doc.foo, 'bar', 'finds doc')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").findOrAdd(id, object) when added', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const object = await cryptoStore.findOrAdd('foo', { foo: 'baz' })

    t.is(object.foo, 'baz', 'adds doc')
    t.ok(object._id.startsWith('test/'), 'prefixes ._id')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").findOrAdd([object1, object2])', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'test/foo',
      foo: 'bar'
    })

    const objects = await cryptoStore.findOrAdd([
      {
        _id: 'foo',
        foo: 'baz'
      },
      {
        _id: 'baz',
        baz: 'bar'
      }
    ])

    t.is(objects[0].foo, 'bar', 'finds doc with _id: test/foo')
    t.is(objects[1].baz, 'bar', 'adds doc with _id: test/baz')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").findAll()', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: 'test/foo' },
      { _id: 'bar' }
    ])

    const objects = await cryptoStore.findAll()

    t.is(objects.length, 1)
    t.is(objects[0]._id, 'test/foo')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").update(id, changedProperties)', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'test/foo',
      foo: 'bar'
    })

    const object = await cryptoStore.update('foo', { foo: 'baz' })

    t.is(object.foo, 'baz')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").update([object1, object2])', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      {
        _id: 'test/foo',
        foo: 'bar'
      },
      {
        _id: 'test/bar',
        bar: 'baz'
      }
    ])

    const objects = await cryptoStore.update([
      {
        _id: 'test/foo',
        foo: 'bar2'
      },
      {
        _id: 'test/bar',
        bar: 'baz2'
      }
    ])

    t.is(objects.length, 2)
    t.is(objects[0].foo, 'bar2')
    t.is(objects[1].bar, 'baz2')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").updateOrAdd(object) when found', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'test/foo',
      foo: 'bar'
    })

    const object = await cryptoStore.updateOrAdd('foo', { foo: 'baz' })
    t.is(object.foo, 'baz', 'finds doc')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").updateOrAdd(object) when added', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const object = await cryptoStore.updateOrAdd('foo', { foo: 'baz' })

    t.is(object.foo, 'baz', 'finds doc')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").updateOrAdd([object1, object2])', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'test/foo',
      foo: 'bar'
    })

    const objects = await cryptoStore.updateOrAdd([
      {
        _id: 'foo',
        foo: 'baz'
      },
      {
        _id: 'baz',
        baz: 'bar'
      }
    ])

    t.is(objects[0].foo, 'baz', 'finds doc with _id: test/foo')
    t.is(objects[1].baz, 'bar', 'adds doc with _id: test/baz')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").updateAll(changedProperties)', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: 'test/foo' },
      { _id: 'bar' }
    ])

    const objects = await cryptoStore.updateAll({ foo: 'bar' })

    t.is(objects.length, 1)
    t.is(objects[0].foo, 'bar')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").remove(id)', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'test/foo',
      foo: 'bar'
    })

    const object = await cryptoStore.remove('foo')

    t.is(object._id, 'test/foo')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").remove([object1, id2])', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: 'test/foo' },
      { _id: 'bar' }
    ])

    const objects = await cryptoStore.remove([
      {
        _id: 'test/foo',
        foo: 'bar2'
      },
      'test/bar'
    ])

    t.is(objects.length, 2)
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").removeAll()', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: 'test/foo' },
      { _id: 'bar' }
    ])

    const objects = await cryptoStore.removeAll()

    t.is(objects.length, 1)
    t.is(objects[0]._id, 'test/foo')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").withIdPrefix("onetwo/").add(properties)', async t => {
  const hoodie = createCryptoStore()

  const cryptoStore = hoodie.cryptoStore.withIdPrefix('test/').withIdPrefix('onetwo/')

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const doc = await cryptoStore.add({
      foo: 'bar'
    })

    t.ok(doc._id.startsWith('test/onetwo/'), 'prefixes id with "test/onetwo/"')
  } catch (err) {
    t.error(err)
  } finally {
    t.end()
  }
})

test('cryptoStore.withIdPrefix("test/").on("change", handler) events', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()
  const testStore = hoodie.cryptoStore.withIdPrefix('test/')

  testStore.on('change', (eventName, object) => {
    t.is(object._id, 'test/foo')
  })

  testStore.on('add', (object) => {
    t.is(object._id, 'test/foo')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    hoodie.cryptoStore.add({ _id: 'foo' })
    testStore.add({ _id: 'foo' })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.withIdPrefix("test/") should pass _ option on', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()
  const hoodie2 = createCryptoStore({ notHandleSpecialDocumentMembers: true })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.withIdPrefix('test/').add({
      value: 42,
      _other: 'public'
    })

    t.fail(new Error('should have thrown with doc_validation'))
  } catch (err) {
    t.is(err.name, 'doc_validation', 'value with _ was passed on')
  }

  try {
    await hoodie2.cryptoStore.setup('test')
    await hoodie2.cryptoStore.unlock('test')

    const obj = await hoodie2.cryptoStore.withIdPrefix('test/').add({
      value: 42,
      _other: 'test value'
    })
    t.is(obj._other, 'test value', 'members with _ are added')

    const encrypted = await hoodie2.store.find(obj._id)
    t.is(encrypted.value, undefined, 'members still get encrypted')
    t.is(encrypted._other, undefined, 'members starting with _ are encrypted')
  } catch (err) {
    t.end(err)
  }
})
