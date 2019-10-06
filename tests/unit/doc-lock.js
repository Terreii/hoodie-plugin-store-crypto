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

  t.throws(function () {
    docLock(null, 'test').unlock()
  }, 'throws when an id was already locked')

  locked.unlock()

  t.end()
})

test('docLock should fail if null is passed as second arg', function (t) {
  t.throws(function () {
    docLock(null, null).unlock()
  }, 'throws if prefix and second arg are null')

  t.throws(function () {
    docLock('user/', null).unlock()
  }, 'throws if prefix is present but second arg is null')

  t.end()
})

test('docLock should handle multiple docs', function (t) {
  var locked = docLock(null, ['test', { _id: 'other' }])

  t.deepEqual(locked.failed, [null, null], 'has an array with errors or null by id index')

  t.throws(function () {
    docLock(null, 'test').unlock()
  }, 'second lock of id "test" throws')

  t.throws(function () {
    docLock(null, 'other').unlock()
  }, 'second lock of id "other" throws')

  try {
    var lockedNull = docLock(null, ['test123', null])
    t.deepEqual(lockedNull.failed, [null, null], "didn't fail with null as document")
  } catch (err) {
    t.fail("shouldn't fail when one doc of an array is null")
  } finally {
    lockedNull.unlock()
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

test('docLock should handle documents with no _id', function (t) {
  t.plan(7)

  var lockedNoPrefix1 = docLock(null, { value: 42 })
  var lockedNoPrefix2 = docLock(null, { other: 'value' })
  var lockedNoPrefix3 = docLock(null, [{ other: 'value' }, { value: 42 }])

  var lockedPrefix1 = docLock('user/', { value: 42 })
  var lockedPrefix2 = docLock('user/', { other: 'value' })
  var lockedPrefix3 = docLock('user/', [{ other: 'value' }, { value: 42 }])

  t.deepEqual(lockedNoPrefix1.failed, [null], "didn't fail if prefix is null and no id is present")
  t.deepEqual(lockedNoPrefix2.failed, [null], "didn't fail by second doc with no id and prefix")
  t.deepEqual(lockedNoPrefix3.failed, [null, null], "didn't fail with array of docs with no ids")

  t.deepEqual(lockedPrefix1.failed, [null], "didn't fail if prefix is present but no id")
  t.deepEqual(lockedPrefix2.failed, [null], "didn't fail by second doc with no id but a prefix")
  t.deepEqual(lockedPrefix3.failed, [null, null], "didn't fail with array of docs with no ids but")

  try {
    lockedNoPrefix1.unlock()
    lockedNoPrefix2.unlock()
    lockedNoPrefix3.unlock()
    lockedPrefix1.unlock()
    lockedPrefix2.unlock()
    lockedPrefix3.unlock()
    t.pass('did unlock all')
  } catch (err) {
    t.end(err)
  }
})
