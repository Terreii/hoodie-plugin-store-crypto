'use strict'

var test = require('tape')
var Promise = require('lie')

var createCryptoStore = require('../utils/createCryptoStore')

function checkTime (objectTime) {
  var now = Date.now()
  var timeObj = new Date(objectTime)
  var isoString = timeObj.toISOString()
  var time = timeObj.getTime()
  return time <= now && time > (now - 20) && objectTime === isoString
}

test('removes existing by id', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'foo',
        bar: 'baz'
      })
    })

    .then(function () {
      return hoodie.cryptoStore.remove('foo')
    })

    .then(function (object) {
      t.is(object._id, 'foo', 'resolves value')
      t.is(object.bar, 'baz', 'resolves value')

      return hoodie.cryptoStore.find('foo')
    })

    .then(function () {
      t.fail("find didn't fail")
    })

    .catch(function (error) {
      t.ok(error instanceof Error, 'rejects error')
    })
})

test('removes existing by object', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'foo',
        bar: 'baz'
      })
    })

    .then(function () {
      return hoodie.cryptoStore.remove({_id: 'foo'})
    })

    .then(function (object) {
      t.is(object._id, 'foo', 'resolves value')
      t.is(object.bar, 'baz', 'resolves value')

      return hoodie.cryptoStore.find('foo')
    })

    .then(function () {
      t.fail("find didn't fail")
    })

    .catch(function (error) {
      t.ok(error instanceof Error, 'rejects error')
    })
})

test('fails for non-existing', function (t) {
  t.plan(6)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.remove('foo')
    })

    .catch(function (error) {
      t.ok(error instanceof Error, 'rejects error')
      t.is(error.name, 'Not found', 'rejects with custom name')
      t.is(error.message, 'Object with id "foo" is missing', 'rejects with custom message')
    })

    .then(function () {
      return hoodie.cryptoStore.remove({_id: 'foo'})
    })

    .then(function () {
      t.fail("find didn't fail")
    })

    .catch(function (error) {
      t.ok(error instanceof Error, 'rejects error')
      t.is(error.name, 'Not found', 'rejects with custom name')
      t.is(error.message, 'Object with id "foo" is missing', 'rejects with custom message')
    })
})

test('cryptoStore.remove(array) removes existing, returns error for non-existing', function (t) {
  t.plan(9)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add([
        { _id: 'exists1', foo: 'bar' },
        { _id: 'exists2', foo: 'baz' }
      ])
    })

    .then(function () {
      return hoodie.cryptoStore.remove([
        'exists1',
        { _id: 'exists2' },
        'unknown'
      ])
    })

    .then(function (objects) {
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
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.remove([changedObjects]) updates before removing', function (t) {
  t.plan(5)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add([
        {
          _id: 'foo',
          foo: 'bar'
        },
        {
          _id: 'bar',
          foo: 'foo'
        }
      ])
    })

    .then(function () {
      return hoodie.cryptoStore.remove([
        {
          _id: 'foo',
          foo: 'changed',
          hoodie: {ignore: 'me'}
        },
        {
          _id: 'bar',
          foo: 'changed'
        }
      ])
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'foo', 'resolves value')
      t.is(objects[0].foo, 'changed', 'check foo is changed')
      t.is(objects[0].hoodie.ignore, undefined, 'ignores hoodie property')
      t.is(objects[1]._id, 'bar', 'resolves value')
      t.is(objects[1].foo, 'changed', 'check foo is changed')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.remove(changedObject) updates before removing', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'foo',
        foo: 'bar'
      })
    })

    .then(function () {
      return hoodie.cryptoStore.remove({_id: 'foo', foo: 'changed', hoodie: {ignore: 'me'}})
    })

    .then(function (object) {
      t.is(object._id, 'foo', 'resolves value')
      t.is(object.foo, 'changed', 'check foo is changed')
      t.is(object.hoodie.ignore, undefined, 'ignores hoodie property')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.remove(id, changedProperties) updates before removing', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'foo',
        foo: 'bar'
      })
    })

    .then(function () {
      return hoodie.cryptoStore.remove('foo', {foo: 'changed', hoodie: {ignore: 'me'}})
    })

    .then(function (object) {
      t.is(object._id, 'foo', 'resolves value')
      t.is(object.foo, 'changed', 'check foo is changed')
      t.is(object.hoodie.ignore, undefined, 'ignores hoodie property')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.remove(id, changeFunction) updates before removing', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'foo',
        foo: 'bar'
      })
    })

    .then(function () {
      return hoodie.cryptoStore.remove('foo', function (doc) {
        doc.foo = 'changed'
        doc.hoodie.ignore = 'me'
        return doc
      })
    })

    .then(function (object) {
      t.is(object._id, 'foo', 'resolves value')
      t.is(object.foo, 'changed', 'check foo is changed')
      t.is(object.hoodie.ignore, undefined, 'ignores hoodie property')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.remove(object) creates deletedAt timestamp', function (t) {
  t.plan(3)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add({
        _id: 'foo',
        foo: 'bar'
      })
    })

    .then(function () {
      return new Promise(function (resolve) {
        setTimeout(resolve, 100)
      })
    })

    .then(function () {
      return hoodie.cryptoStore.remove('foo')
    })

    .then(function (object) {
      t.is(object._id, 'foo', 'resolves doc')
      t.ok(object.hoodie.deletedAt, 'should have deleteAt timestamps')
      t.ok(checkTime(object.hoodie.deletedAt), 'deletedAt should be a valid date of right now')
    })

    .catch(function (err) {
      t.end(err)
    })
})

test('cryptoStore.remove([objects]) creates deletedAt timestamps', function (t) {
  t.plan(10)

  var hoodie = createCryptoStore()

  hoodie.cryptoStore.setPassword('test')

    .then(function () {
      return hoodie.cryptoStore.add([
        {
          _id: 'foo',
          foo: 'bar'
        },
        {
          _id: 'bar',
          foo: 'foo'
        }
      ])
    })

    .then(function () {
      return hoodie.cryptoStore.remove(['foo', 'bar'])
    })

    .then(function (objects) {
      t.is(objects[0]._id, 'foo', 'resolves doc')
      t.is(objects[1]._id, 'bar', 'resolves doc')

      objects.forEach(function (object) {
        t.ok(object.hoodie.createdAt, 'should have createdAt timestamp')
        t.ok(object.hoodie.updatedAt, 'should have updatedAt timestamp')
        t.ok(object.hoodie.deletedAt, 'should have deleteAt timestamp')
        t.ok(checkTime(object.hoodie.deletedAt), 'deletedAt should be a valid date of right now')
      })
    })

    .catch(function (err) {
      t.end(err)
    })
})
