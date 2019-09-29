'use strict'

var test = require('tape')

var docLock = require('../../lib/utils/doc-lock')

test('docLock should return a unlock function', function (t) {
  t.plan(1)

  var unlock = docLock(null, 'firstTest')

  t.is(typeof unlock, 'function', 'returns a function')

  unlock()

  t.end()
})

test('docLock should unlock if the returned function is called', function (t) {
  try {
    var unlock = docLock(null, 'test')

    unlock()

    docLock(null, 'test')()

    t.pass('did unlock')
    t.end()
  } catch (err) {
    t.end(err)
  }
})

test('docLock should throw an conflict error if a document was already locked', function (t) {
  var unlock = docLock(null, 'test')

  try {
    docLock(null, 'test')()
    t.fail("shouldn't fail with same prefix")
  } catch (err) {
    t.ok('does throw')
  } finally {
    unlock()
  }

  t.end()
})

test('docLock should handle multiple docs', function (t) {
  var unlock = docLock(null, ['test', 'other'])

  try {
    docLock(null, 'test')()
    t.fail("shouldn't fail with same prefix")
  } catch (err) {
    t.ok('does throw')
  }

  try {
    docLock(null, 'other')()
    t.fail("shouldn't fail with same prefix")
  } catch (err) {
    t.ok('does throw')
  }

  unlock()

  try {
    docLock(null, ['test', 'other'])()
    t.pass('did unlock')
    t.end()
  } catch (err) {
    t.end(err)
  }
})

test('docLock should handle prefixes', function (t) {
  t.plan(1)

  var unlock = docLock('user/', 'test')

  try {
    docLock(null, 'test')()
    docLock('other/', 'test')()
  } catch (err) {
    t.fail("shouldn't fail with different prefix")
  }

  try {
    docLock('user/', 'test')()
    t.fail("shouldn't fail with same prefix")
  } catch (err) {
    t.is(err.status, 409, 'did error with same prefix')
  }

  unlock()

  try {
    docLock('user/', 'test')()
  } catch (err) {
    t.fail("shouldn't fail with same prefix")
  }

  t.end()
})
