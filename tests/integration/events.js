'use strict'

/*
 * Testing the Event handling.
 *
 * Most tests are copied and adjusted from https://github.com/hoodiehq/hoodie-store-client
 */

const test = require('tape')

const createCryptoStore = require('../utils/createCryptoStore')
const addCryptoStoreToHoodie = require('../../hoodie/client')

function noop () {}

test('cryptoStore has on', t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.on, 'function', 'has method')
})

test('cryptoStore has off', t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.off, 'function', 'has method')
})

test('cryptoStore has one', t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.one, 'function', 'has method')
})

test('cryptoStore.on("add") with adding one', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  hoodie.cryptoStore.on('add', object => {
    t.pass('triggers 1 add event')
    t.is(object.foo, 'bar', 'event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ foo: 'bar' })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.on("add") with adding two', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()
  const objects = []

  hoodie.cryptoStore.on('add', object => {
    objects.push(object)

    if (objects.length < 2) {
      return
    }

    const orderedObjAttrs = [
      objects[0].foo,
      objects[1].foo
    ].sort()

    t.is(orderedObjAttrs.length, 2, 'triggers 2 add event')
    t.is(orderedObjAttrs[0], 'bar', '1st event passes object')
    t.is(orderedObjAttrs[1], 'baz', '2nd event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    hoodie.cryptoStore.add([
      { foo: 'bar' },
      { foo: 'baz' }
    ])
  } catch (err) {
    t.end(err)
  }
})

test(
  'cryptoStore.on("add") with one element added before registering event and one after',
  async t => {
    t.plan(2)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      await hoodie.cryptoStore.add({ foo: 'bar' })

      hoodie.cryptoStore.on('add', object => {
        t.pass('triggers only 1 add event')
        t.is(object.foo, 'baz', 'event passes object')
      })

      hoodie.cryptoStore.add({ foo: 'baz' })
    } catch (err) {
      t.end(err)
    }
  }
)

test('cryptoStore.on("add") with add & update', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  hoodie.cryptoStore.on('add', object => {
    t.pass('triggers only 1 add event')
    t.is(object.nr, 1, 'event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.updateOrAdd({
      _id: 'test',
      nr: 1
    })

    await hoodie.cryptoStore.updateOrAdd('test', { nr: 2 })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.on("update") with updating one', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  hoodie.cryptoStore.on('update', object => {
    t.pass('triggers only 1 add event')
    t.is(object.foo, 'bar', 'event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'test' })

    await hoodie.cryptoStore.update({
      _id: 'test',
      foo: 'bar'
    })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.on("update") with updating two', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()
  const objects = []

  hoodie.cryptoStore.on('update', object => {
    objects.push(object)

    if (objects.length < 2) {
      return
    }

    const orderedObjAttrs = [
      objects[0].foo,
      objects[1].foo
    ].sort()

    t.is(orderedObjAttrs.length, 2, 'triggers 2 update event')
    t.is(orderedObjAttrs[0], 'bar', '1st event passes object')
    t.is(orderedObjAttrs[1], 'baz', '2nd event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: 'first' },
      { _id: 'second' }
    ])

    await hoodie.cryptoStore.update([
      { _id: 'first', foo: 'bar' },
      { _id: 'second', foo: 'baz' }
    ])
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.on("update") with add & update', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  hoodie.cryptoStore.on('update', object => {
    t.pass('triggers 1 update event')
    t.is(object.nr, 2, 'event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.updateOrAdd({
      _id: 'test',
      nr: 1
    })

    await hoodie.cryptoStore.updateOrAdd('test', { nr: 2 })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.on("update") with update all', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()
  const objects = []

  hoodie.cryptoStore.on('update', object => {
    objects.push(object)

    if (objects.length < 2) {
      return
    }

    const orderedObjAttrs = [
      objects[0].foo,
      objects[1].foo
    ].sort()

    t.is(orderedObjAttrs.length, 2, 'triggers 2 update events')
    t.is(orderedObjAttrs[0], '1', '1st event passes object')
    t.is(orderedObjAttrs[1], '2', '2nd event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: 'first', foo: '1' },
      { _id: 'second', foo: '2' }
    ])

    await hoodie.cryptoStore.updateAll({ bar: 'baz' })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.on("remove") with removing one', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  hoodie.cryptoStore.on('remove', object => {
    t.pass('triggers 1 remove event')
    t.is(object.foo, 'bar', 'event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'one',
      foo: 'bar'
    })

    await hoodie.cryptoStore.remove('one')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.on("remove") with removing two', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()
  const objects = []

  hoodie.cryptoStore.on('remove', object => {
    objects.push(object)

    if (objects.length < 2) {
      return
    }

    const orderedObjAttrs = [
      objects[0]._id,
      objects[1]._id
    ].sort()

    t.is(orderedObjAttrs.length, 2, 'triggers 2 remove events')
    t.is(orderedObjAttrs[0], 'one', '1st event passes object')
    t.is(orderedObjAttrs[1], 'two', '2nd event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: 'one' },
      { _id: 'two' }
    ])

    await hoodie.cryptoStore.remove(['one', 'two'])
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.on("remove") with remove all', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()
  const objects = []

  hoodie.cryptoStore.on('remove', object => {
    objects.push(object)

    if (objects.length < 2) {
      return
    }

    const orderedObjAttrs = [
      objects[0]._id,
      objects[1]._id
    ].sort()

    t.is(orderedObjAttrs.length, 2, 'triggers 2 remove events')
    t.is(orderedObjAttrs[0], 'one', '1st event passes object')
    t.is(orderedObjAttrs[1], 'two', '2nd event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { _id: 'one' },
      { _id: 'two' }
    ])

    await hoodie.cryptoStore.removeAll()
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.on("change") with adding one', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  hoodie.cryptoStore.on('change', (eventName, object) => {
    t.pass('triggers 1 change event')
    t.is(eventName, 'add', 'passes the event name')
    t.is(object.foo, 'bar', 'event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ foo: 'bar' })
  } catch (err) {
    t.end(err)
  }
})

test(
  'cryptoStore.on("add") should not emit after cryptoStore.add() promise resolved',
  async t => {
    t.plan(1)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      await hoodie.cryptoStore.add({ _id: 'test' })

      hoodie.cryptoStore.on('add', t.fail.bind(t, 'should not emit "add" event'))
      hoodie.cryptoStore.on('update', t.pass.bind(t, 'emits "update" event'))

      await hoodie.cryptoStore.update({ _id: 'test' })
    } catch (err) {
      t.end(err)
    }
  }
)

test('cryptoStore.on("change") with updating one', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'test' })

    hoodie.cryptoStore.on('change', (eventName, object) => {
      t.pass('triggers 1 change event')
      t.is(eventName, 'update', 'passes the event name')
      t.is(object.foo, 'bar', 'event passes object')
    })

    await hoodie.cryptoStore.update({
      _id: 'test',
      foo: 'bar'
    })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.on("change") with removing one', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'test',
      foo: 'bar'
    })

    hoodie.cryptoStore.on('change', (eventName, object) => {
      t.pass('triggers 1 change event')
      t.is(eventName, 'remove', 'passes the event name')
      t.is(object.foo, 'bar', 'event passes object')
    })

    await hoodie.cryptoStore.remove('test')
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.on("change") with adding one and updating it afterwards', async t => {
  t.plan(4)

  const hoodie = createCryptoStore()

  function handleFirstChange (eventName, object) {
    t.is(object.foo, 'bar', '1st event passes object')
    t.is(eventName, 'add', '1st event passes the event name')

    hoodie.cryptoStore.on('change', handleSecondChange)
  }

  function handleSecondChange (eventName, object) {
    t.is(object.foo, 'baz', '2nd event passes object')
    t.is(eventName, 'update', '2nd event passes the event name')
  }

  hoodie.cryptoStore.one('change', handleFirstChange)

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({
      _id: 'one',
      foo: 'bar'
    })

    await hoodie.cryptoStore.update({
      _id: 'one',
      foo: 'baz'
    })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.off("add") with one add handler', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  function addHandler () {
    t.fail('should not trigger add event')
  }

  hoodie.cryptoStore.on('add', addHandler)
  hoodie.cryptoStore.on('change', () => {
    t.pass('triggers change event')
  })
  hoodie.cryptoStore.off('add', addHandler)

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ foo: 'bar' })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.off("add") with removing one of two add handlers', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  function firstAddHandler () {
    t.fail('should not call first event handler')
  }

  function secondAddHandler () {
    t.pass('should call second event handler')
  }

  hoodie.cryptoStore.on('add', firstAddHandler)
  hoodie.cryptoStore.on('add', secondAddHandler)
  hoodie.cryptoStore.off('add', firstAddHandler)

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ foo: 'bar' })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.off("update") with one update handler', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  function updateHandler () {
    t.fail('should not trigger update event')
  }

  hoodie.cryptoStore.on('update', updateHandler)
  hoodie.cryptoStore.on('change', eventName => {
    if (eventName === 'update') {
      t.pass('triggers change event')
    }
  })
  hoodie.cryptoStore.off('update', updateHandler)

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const object = await hoodie.cryptoStore.add({ foo: 'bar' })
    await hoodie.cryptoStore.update(object)
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.off("remove") with one remove handler', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  function removeHandler () {
    t.fail('should not trigger remove event')
  }

  hoodie.cryptoStore.on('remove', removeHandler)
  hoodie.cryptoStore.on('change', eventName => {
    if (eventName === 'remove') {
      t.pass('triggers change event')
    }
  })
  hoodie.cryptoStore.off('remove', removeHandler)

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    const object = await hoodie.cryptoStore.add({ foo: 'bar' })
    await hoodie.cryptoStore.remove(object)
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.one("add") with adding one', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  hoodie.cryptoStore.one('add', object => {
    t.pass('triggers 1 add event')
    t.is(object.foo, 'bar', 'event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ foo: 'bar' })
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.one("add") with adding two', async t => {
  t.plan(3)

  const hoodie = createCryptoStore()

  hoodie.cryptoStore.one('add', () => {
    t.pass('store.one handler')
  })
  hoodie.cryptoStore.on('add', () => {
    t.pass('store.on handler')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add([
      { foo: 'bar' },
      { foo: 'baz' }
    ])
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore.one("add") with add & update', async t => {
  t.plan(2)

  const hoodie = createCryptoStore()

  hoodie.cryptoStore.one('add', object => {
    t.pass('store.one handler')
    t.is(object.nr, 1, 'event passes object')
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'test', nr: 1 })

    await hoodie.cryptoStore.updateOrAdd('test', { nr: 2 })
  } catch (err) {
    t.end(err)
  }
})

test(
  'cryptoStore.one("add") with one element added before registering event and one after',
  async t => {
    t.plan(2)

    const hoodie = createCryptoStore()

    try {
      await hoodie.cryptoStore.setup('test')
      await hoodie.cryptoStore.unlock('test')

      await hoodie.cryptoStore.add({ foo: 'bar' })

      hoodie.cryptoStore.one('add', object => {
        t.pass('store.one handler')
        t.is(object.foo, 'baz', 'event passes object')
      })

      await hoodie.cryptoStore.add({ foo: 'baz' })
    } catch (err) {
      t.end(err)
    }
  }
)

test('cryptoStore.on returns store', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()
  const isFunction = hoodie.cryptoStore.on('add', noop) &&
    typeof hoodie.cryptoStore.on('add', noop).on === 'function'

  t.ok(isFunction, 'allows chaining')
})

test('cryptoStore.one returns store', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()
  const isFunction = hoodie.cryptoStore.one('add', noop) &&
    typeof hoodie.cryptoStore.one('add', noop).on === 'function'

  t.ok(isFunction, 'allows chaining')
})

test('cryptoStore.off returns store', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()
  const isFunction = hoodie.cryptoStore.off('add', noop) &&
    typeof hoodie.cryptoStore.off('add', noop).on === 'function'

  t.ok(isFunction, 'allows chaining')
})

test('events should emit before methods resolve', async t => {
  t.plan(1)

  const hoodie = createCryptoStore()
  let eventTriggered = false

  hoodie.cryptoStore.on('add', () => {
    eventTriggered = true
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.add({ _id: 'foo' })

    t.ok(eventTriggered)
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore should only listen to events, if a handler was added', async t => {
  t.plan(16)

  let afterAddingCryptoStore = false
  let shouldHave = false

  const hoodie = {
    account: {
      on () {}
    },
    store: {
      on (eventName, handler) {
        t.is(afterAddingCryptoStore, true, "creating cryptoStore doesn't add an handler")
        t.is(shouldHave, true, 'handler should be added, only if a handler was added to it')
        t.is(eventName, 'change', 'a change handler was added')
        t.is(typeof handler, 'function', 'handler should be a function')
      },
      off (eventName, handler) {
        t.is(afterAddingCryptoStore, true, "creating cryptoStore doesn't add an handler")
        t.is(shouldHave, false, 'handler should remove its handler if it has 0 handler')
        t.is(eventName, 'change', 'a change handler should be removed')
        t.is(typeof handler, 'function', 'handler should be a function')
      }
    }
  }
  const handler = () => {}

  addCryptoStoreToHoodie(hoodie)
  afterAddingCryptoStore = true

  shouldHave = true
  hoodie.cryptoStore.on('add', handler)

  shouldHave = false
  hoodie.cryptoStore.off('add', handler)

  const testStore = hoodie.cryptoStore.withIdPrefix('test/')

  shouldHave = true
  testStore.on('add', handler)

  shouldHave = false
  testStore.off('add', handler)
})

test('cryptoStore should emit events only for encrypted objects', async t => {
  t.plan(6)

  const hoodie = createCryptoStore()

  let eventNumber = 0

  hoodie.cryptoStore.on('change', (eventName, object) => {
    if (eventNumber === 0) {
      t.is(eventName, 'add', 'event is the add event')
      t.is(object._id, 'encrypted', 'the correct object was added')
    } else if (eventNumber === 1) {
      t.is(eventName, 'update', 'event is a update event')
      t.is(object._id, 'notEncrypted', 'the notEncrypted object was encrypted')
    } else if (eventNumber === 2) {
      t.is(eventName, 'update', 'event is a update event')
      t.is(object._id, 'encrypted', 'the encrypted object was updated')
    }

    eventNumber += 1
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.store.add({
      _id: 'notEncrypted',
      foo: 'bar'
    })

    await hoodie.cryptoStore.add({
      _id: 'encrypted',
      foo: 'bar'
    })

    await hoodie.cryptoStore.update({
      _id: 'notEncrypted',
      foo: 'baz'
    })

    await hoodie.cryptoStore.update({
      _id: 'encrypted',
      foo: 'baz'
    })
  } catch (err) {
    t.end(err)
  }
})

test("cryptoStore shouldn't emit events for hoodiePluginCryptoStore/ docs", async t => {
  t.plan(1)

  const hoodie = createCryptoStore()

  let eventCount = 0

  hoodie.cryptoStore.on('change', (eventName, object) => {
    if (object._id.startsWith('hoodiePluginCryptoStore/')) {
      eventCount += 1
    }
  })

  try {
    await hoodie.cryptoStore.setup('test')
    await hoodie.cryptoStore.unlock('test')

    await hoodie.cryptoStore.changePassword('test', 'otherPassword')

    t.equal(eventCount, 0, 'No events for hoodiePluginCryptoStore docs should be emitted.')
    t.end()
  } catch (err) {
    t.end(err)
  }
})
