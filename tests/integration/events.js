'use strict'

var test = require('tape')

var createCryptoStore = require('../utils/createCryptoStore')

function noop () {}

test('cryptoStore has on', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.on, 'function', 'has method')
})

test('cryptoStore has off', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.off, 'function', 'has method')
})

test('cryptoStore has one', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  t.is(typeof hoodie.cryptoStore.one, 'function', 'has method')
})

test('cryptoStore.on("add") with adding one', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.on('add', function (object) {
    t.pass('triggers 1 add event')
    t.is(object.foo, 'bar', 'event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      hoodie.cryptoStore.add({
        foo: 'bar'
      })
    })
})

test('cryptoStore.on("add") with adding two', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()
  var objects = []

  hoodie.cryptoStore.on('add', function (object) {
    objects.push(object)

    if (objects.length < 2) {
      return
    }

    var orderedObjAttrs = [
      objects[0].foo,
      objects[1].foo
    ].sort()

    t.is(orderedObjAttrs.length, 2, 'triggers 2 add event')
    t.is(orderedObjAttrs[0], 'bar', '1st event passes object')
    t.is(orderedObjAttrs[1], 'baz', '2nd event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      hoodie.cryptoStore.add([
        {foo: 'bar'},
        {foo: 'baz'}
      ])
    })
})

test(
  'cryptoStore.on("add") with one element added before registering event and one after',
  function (t) {
    t.plan(2)

    var hoodie = createCryptoStore()

    hoodie.cryptoStore.setPassword('test')

      .then(function () {
        return hoodie.cryptoStore.add({
          foo: 'bar'
        })
      })

      .then(function () {
        hoodie.cryptoStore.on('add', function (object) {
          t.pass('triggers only 1 add event')
          t.is(object.foo, 'baz', 'event passes object')
        })

        hoodie.cryptoStore.add({
          foo: 'baz'
        })
      })
  }
)

test('cryptoStore.on("add") with add & update', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.on('add', function (object) {
    t.pass('triggers only 1 add event')
    t.is(object.nr, 1, 'event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd({
        _id: 'test',
        nr: 1
      })
    })

    .then(function () {
      hoodie.cryptoStore.updateOrAdd('test', {nr: 2})
    })
})

test('cryptoStore.on("update") with updating one', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.on('update', function (object) {
    t.pass('triggers only 1 add event')
    t.is(object.foo, 'bar', 'event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test'
      })
    })

    .then(function (obj) {
      hoodie.cryptoStore.update({
        _id: 'test',
        foo: 'bar'
      })
    })
})

test('cryptoStore.on("update") with updating two', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()
  var objects = []

  hoodie.cryptoStore.on('update', function (object) {
    objects.push(object)

    if (objects.length < 2) {
      return
    }

    var orderedObjAttrs = [
      objects[0].foo,
      objects[1].foo
    ].sort()

    t.is(orderedObjAttrs.length, 2, 'triggers 2 update event')
    t.is(orderedObjAttrs[0], 'bar', '1st event passes object')
    t.is(orderedObjAttrs[1], 'baz', '2nd event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add([
        {_id: 'first'},
        {_id: 'second'}
      ])
    })

    .then(function (obj) {
      hoodie.cryptoStore.update([
        { _id: 'first', foo: 'bar' },
        { _id: 'second', foo: 'baz' }
      ])
    })
})

test('cryptoStore.on("update") with add & update', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.on('update', function (object) {
    t.pass('triggers 1 update event')
    t.is(object.nr, 2, 'event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.updateOrAdd({
        _id: 'test',
        nr: 1
      })
    })

    .then(function () {
      hoodie.cryptoStore.updateOrAdd('test', {nr: 2})
    })
})

test('cryptoStore.on("update") with update all', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()
  var objects = []

  hoodie.cryptoStore.on('update', function (object) {
    objects.push(object)

    if (objects.length < 2) {
      return
    }

    var orderedObjAttrs = [
      objects[0].foo,
      objects[1].foo
    ].sort()

    t.is(orderedObjAttrs.length, 2, 'triggers 2 update events')
    t.is(orderedObjAttrs[0], '1', '1st event passes object')
    t.is(orderedObjAttrs[1], '2', '2nd event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add([
        {_id: 'first', foo: '1'},
        {_id: 'second', foo: '2'}
      ])
    })

    .then(function () {
      hoodie.cryptoStore.updateAll({
        bar: 'baz'
      })
    })
})

test('cryptoStore.on("remove") with removing one', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.on('remove', function (object) {
    t.pass('triggers 1 remove event')
    t.is(object.foo, 'bar', 'event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'one',
        foo: 'bar'
      })
    })

    .then(function () {
      return hoodie.cryptoStore.remove('one')
    })
})

test('cryptoStore.on("remove") with removing two', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()
  var objects = []

  hoodie.cryptoStore.on('remove', function (object) {
    objects.push(object)

    if (objects.length < 2) {
      return
    }

    var orderedObjAttrs = [
      objects[0]._id,
      objects[1]._id
    ].sort()

    t.is(orderedObjAttrs.length, 2, 'triggers 2 remove events')
    t.is(orderedObjAttrs[0], 'one', '1st event passes object')
    t.is(orderedObjAttrs[1], 'two', '2nd event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add([
        {_id: 'one'},
        {_id: 'two'}
      ])
    })

    .then(function () {
      hoodie.cryptoStore.remove(['one', 'two'])
    })
})

test('cryptoStore.on("remove") with remove all', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()
  var objects = []

  hoodie.cryptoStore.on('remove', function (object) {
    objects.push(object)

    if (objects.length < 2) {
      return
    }

    var orderedObjAttrs = [
      objects[0]._id,
      objects[1]._id
    ].sort()

    t.is(orderedObjAttrs.length, 2, 'triggers 2 remove events')
    t.is(orderedObjAttrs[0], 'one', '1st event passes object')
    t.is(orderedObjAttrs[1], 'two', '2nd event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add([
        {_id: 'one'},
        {_id: 'two'}
      ])
    })

    .then(function () {
      hoodie.cryptoStore.removeAll()
    })
})

test('cryptoStore.on("change") with adding one', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.on('change', function (eventName, object) {
    t.pass('triggers 1 change event')
    t.is(eventName, 'add', 'passes the event name')
    t.is(object.foo, 'bar', 'event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        foo: 'bar'
      })
    })
})

test('cryptoStore.on("add") should not emit after store.add() promise resolved', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test'
      })
    })

    .then(function () {
      hoodie.cryptoStore.on('add', t.fail.bind(t, 'should not emit "add" event'))
      hoodie.cryptoStore.on('update', t.pass.bind(t, 'emits "update" event'))

      hoodie.cryptoStore.update({
        _id: 'test'
      })
    })
})

test('cryptoStore.on("change") with updating one', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test'
      })
    })

    .then(function () {
      hoodie.cryptoStore.on('change', function (eventName, object) {
        t.pass('triggers 1 change event')
        t.is(eventName, 'update', 'passes the event name')
        t.is(object.foo, 'bar', 'event passes object')
      })

      hoodie.cryptoStore.update({
        _id: 'test',
        foo: 'bar'
      })
    })
})

test('cryptoStore.on("change") with removing one', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test',
        foo: 'bar'
      })
    })

    .then(function () {
      hoodie.cryptoStore.on('change', function (eventName, object) {
        t.pass('triggers 1 change event')
        t.is(eventName, 'remove', 'passes the event name')
        t.is(object.foo, 'bar', 'event passes object')
      })

      hoodie.cryptoStore.remove('test')
    })
})

test('cryptoStore.on("change") with adding one and updating it afterwards', function (t) {
  t.plan(4)

  var hoodie = createCryptoStore()

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

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'test',
        foo: 'bar'
      })
    })

    .then(function () {
      hoodie.cryptoStore.update({
        _id: 'one',
        foo: 'baz'
      })
    })
})

test('cryptoStore.off("add") with one add handler', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  var addHandler = function () {
    t.fail('should not trigger add event')
  }

  hoodie.cryptoStore.on('add', addHandler)
  hoodie.cryptoStore.on('change', function () {
    t.pass('triggers change event')
  })
  hoodie.cryptoStore.off('add', addHandler)

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        foo: 'bar'
      })
    })
})

test('cryptoStore.off("add") with removing one of two add handlers', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  var firstAddHandler = function () {
    t.fail('should not call first event handler')
  }

  var secondAddHandler = function () {
    t.pass('should call second event handler')
  }

  hoodie.cryptoStore.on('add', firstAddHandler)
  hoodie.cryptoStore.on('add', secondAddHandler)
  hoodie.cryptoStore.off('add', firstAddHandler)

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        foo: 'bar'
      })
    })
})

test('cryptoStore.off("update") with one update handler', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  var updateHandler = function () {
    t.fail('should not trigger update event')
  }

  hoodie.cryptoStore.on('update', updateHandler)
  hoodie.cryptoStore.on('change', function (eventName) {
    if (eventName === 'update') {
      t.pass('triggers change event')
    }
  })
  hoodie.cryptoStore.off('update', updateHandler)

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        foo: 'bar'
      })
    })

    .then(hoodie.cryptoStore.update)
})

test('cryptoStore.off("remove") with one remove handler', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()

  var removeHandler = function () {
    t.fail('should not trigger remove event')
  }

  hoodie.cryptoStore.on('remove', removeHandler)
  hoodie.cryptoStore.on('change', function (eventName) {
    if (eventName === 'remove') {
      t.pass('triggers change event')
    }
  })
  hoodie.cryptoStore.off('remove', removeHandler)

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        foo: 'bar'
      })
    })

    .then(hoodie.cryptoStore.remove)
})

test('cryptoStore.one("add") with adding one', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.one('add', function (object) {
    t.pass('triggers 1 add event')
    t.is(object.foo, 'bar', 'event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        foo: 'bar'
      })
    })
})

test('cryptoStore.one("add") with adding two', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.one('add', function () {
    t.pass('store.one handler')
  })
  hoodie.cryptoStore.on('add', function () {
    t.pass('store.on handler')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add([
        {foo: 'bar'},
        {foo: 'baz'}
      ])
    })
})

test('cryptoStore.one("add") with add & update', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.one('add', function (object) {
    t.pass('store.one handler')
    t.is(object.nr, 1, 'event passes object')
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({_id: 'test', nr: 1})
    })

    .then(function () {
      hoodie.cryptoStore.updateOrAdd('test', {nr: 2})
    })
})

test('cryptoStore.one("add") with one element added before registering event and one after', function (t) {
  t.plan(2)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        foo: 'bar'
      })
    })

    .then(function () {
      hoodie.cryptoStore.one('add', function (object) {
        t.pass('store.one handler')
        t.is(object.foo, 'baz', 'event passes object')
      })

      hoodie.cryptoStore.add({
        foo: 'baz'
      })
    })
})

test('cryptoStore.on returns store', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()
  var isFunction = hoodie.cryptoStore.on('add', noop) &&
    typeof hoodie.cryptoStore.on('add', noop).on === 'function'

  t.ok(isFunction, 'allows chaining')
})

test('cryptoStore.one returns store', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()
  var isFunction = hoodie.cryptoStore.one('add', noop) &&
    typeof hoodie.cryptoStore.one('add', noop).on === 'function'

  t.ok(isFunction, 'allows chaining')
})

test('cryptoStore.off returns store', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()
  var isFunction = hoodie.cryptoStore.off('add', noop) &&
    typeof hoodie.cryptoStore.off('add', noop).on === 'function'

  t.ok(isFunction, 'allows chaining')
})

test('events should emit before methods resolve', function (t) {
  t.plan(1)

  var hoodie = createCryptoStore()
  var eventTriggered = false

  hoodie.cryptoStore.on('add', function () {
    eventTriggered = true
  })

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'foo'
      })
    })

    .then(function () {
      t.ok(eventTriggered)
    })
})
