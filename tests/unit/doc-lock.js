'use strict'

var test = require('tape')

var docLock = require('../../lib/utils/doc-lock')

test(
  'docLock should return a object with an unlock function and lists of locked docs and failures',
  function (t) {
    t.plan(4)

    var locked = docLock(null, 'firstTest')

    t.is(typeof locked, 'object', 'returns an object')
    t.is(typeof locked.unlock, 'function', 'with a function')

    t.ok(Array.isArray(locked.failed), 'has an Array of failed ids')
    t.deepEqual(locked.failed, [null], 'failed Array contains one null')

    locked.unlock()

    t.end()
  }
)

test('docLock should unlock if the unlock function is called', function (t) {
  try {
    var locked = docLock(null, 'test')

    locked.unlock()

    docLock(null, 'test').unlock()

    t.pass('did unlock')
    t.end()
  } catch (err) {
    t.end(err)
  }
})

test('docLock should work with a string and an object', function (t) {
  t.plan(1)

  var locked1 = docLock(null, 'test')

  try {
    var locked2 = docLock(null, { _id: 'test' })
    locked2.unlock()
    t.fail('should have thrown')
  } catch (err) {
    t.is(err.status, 409, 'did error with conflict error')
  } finally {
    locked1.unlock()
  }
})

test('docLock should throw an conflict error if a document was already locked', function (t) {
  var locked = docLock(null, 'test')

  try {
    docLock(null, 'test').unlock()
    t.fail("shouldn't fail with same prefix")
  } catch (err) {
    t.ok('does throw')
  } finally {
    locked.unlock()
  }

  t.end()
})

test('docLock should handle multiple docs', function (t) {
  var locked = docLock(null, ['test', { _id: 'other' }])

  t.deepEqual(locked.failed, [null, null], 'has an array with errors or null by id index')

  try {
    docLock(null, 'test').unlock()
    t.fail('should throw with same prefix')
  } catch (err) {
    t.ok('does throw')
  }

  try {
    docLock(null, 'other').unlock()
    t.fail('should throw with same prefix')
  } catch (err) {
    t.ok('does throw')
  }

  var otherLocked = docLock(null, ['test', 'notLocked'])
  t.ok(otherLocked.failed[0] instanceof Error, 'already locked doc has an error')
  t.is(otherLocked.failed[1], null, 'new lock has null in failed array')
  otherLocked.unlock()

  locked.unlock()

  try {
    var finalLock = docLock(null, ['test', 'other'])
    t.deepEqual(finalLock.failed, [null, null], 'unlock will unlock all ids')
    finalLock.unlock()
    t.end()
  } catch (err) {
    t.end(err)
  }
})

test('docLock should handle prefixes', function (t) {
  t.plan(1)

  var locked = docLock('user/', 'test')

  try {
    docLock(null, 'test').unlock()
    docLock('other/', 'test').unlock()
  } catch (err) {
    t.fail("shouldn't fail with different prefix")
  }

  try {
    docLock('user/', 'test').unlock()
    t.fail("shouldn't fail with same prefix")
  } catch (err) {
    t.is(err.status, 409, 'did error with same prefix')
  }

  locked.unlock()

  try {
    docLock('user/', 'test').unlock()
  } catch (err) {
    t.fail("shouldn't fail with same prefix")
  }

  t.end()
})

test('docLock should return the error it was passed as document or id', function (t) {
  t.plan(2)

  var error = new Error('test')
  var locked = docLock(null, [error, 'testDocId'])

  t.is(locked.failed[0], error, 'failed contains passed error')
  t.is(locked.failed[1], null, "correct doc doesn't fail")

  locked.unlock()
})
