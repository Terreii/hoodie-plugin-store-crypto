'use strict'

const test = require('tape')

const docLock = require('../../lib/utils/doc-lock')

test(
  'docLock should return a object with an unlock function and lists of locked docs and failures',
  t => {
    t.plan(4)

    const locked = docLock(null, 'firstTest')

    t.is(typeof locked, 'object', 'returns an object')
    t.is(typeof locked.unlock, 'function', 'with a function')

    t.ok(Array.isArray(locked.failed), 'has an Array of failed ids')
    t.deepEqual(locked.failed, [null], 'failed Array contains one null')

    locked.unlock()

    t.end()
  }
)

test('docLock should unlock if the unlock function is called', t => {
  try {
    const locked = docLock(null, 'test')

    locked.unlock()

    docLock(null, 'test').unlock()

    t.pass('did unlock')
    t.end()
  } catch (err) {
    t.end(err)
  }
})

test('docLock should work with a string and an object', t => {
  t.plan(1)

  const locked1 = docLock(null, 'test')

  try {
    const locked2 = docLock(null, { _id: 'test' })
    locked2.unlock()
    t.fail('should have thrown')
  } catch (err) {
    t.is(err.status, 409, 'did error with conflict error')
  } finally {
    locked1.unlock()
  }
})

test('docLock should throw an conflict error if a document was already locked', t => {
  const locked = docLock(null, 'test')

  t.throws(
    () => docLock(null, 'test').unlock(),
    'throws when an id was already locked'
  )

  locked.unlock()

  t.end()
})

test('docLock should fail if null is passed as second arg', t => {
  t.throws(
    () => docLock(null, null).unlock(),
    'throws if prefix and second arg are null'
  )

  t.throws(
    () => docLock('user/', null).unlock(),
    'throws if prefix is present but second arg is null'
  )

  t.end()
})

test('docLock should handle multiple docs', t => {
  const locked = docLock(null, ['test', { _id: 'other' }])

  t.deepEqual(locked.failed, [null, null], 'has an array with errors or null by id index')

  t.throws(
    () => docLock(null, 'test').unlock(),
    'second lock of id "test" throws'
  )

  t.throws(
    () => docLock(null, 'other').unlock(),
    'second lock of id "other" throws'
  )

  let lockedNull
  try {
    lockedNull = docLock(null, ['test123', null])
    t.deepEqual(lockedNull.failed, [null, null], "didn't fail with null as document")
  } catch (err) {
    t.fail("shouldn't fail when one doc of an array is null")
  } finally {
    lockedNull.unlock()
  }

  const otherLocked = docLock(null, ['test', 'notLocked'])
  t.ok(otherLocked.failed[0] instanceof Error, 'already locked doc has an error')
  t.is(otherLocked.failed[1], null, 'new lock has null in failed array')
  otherLocked.unlock()

  locked.unlock()

  try {
    const finalLock = docLock(null, ['test', 'other'])
    t.deepEqual(finalLock.failed, [null, null], 'unlock will unlock all ids')
    finalLock.unlock()
    t.end()
  } catch (err) {
    t.end(err)
  }
})

test('docLock should handle prefixes', t => {
  t.plan(1)

  const locked = docLock('user/', 'test')

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

test('docLock should return the error it was passed as document or id', t => {
  t.plan(2)

  const error = new Error('test')
  const locked = docLock(null, [error, 'testDocId'])

  t.is(locked.failed[0], error, 'failed contains passed error')
  t.is(locked.failed[1], null, "correct doc doesn't fail")

  locked.unlock()
})

test('docLock should handle documents with no _id', t => {
  t.plan(7)

  const lockedNoPrefix1 = docLock(null, { value: 42 })
  const lockedNoPrefix2 = docLock(null, { other: 'value' })
  const lockedNoPrefix3 = docLock(null, [{ other: 'value' }, { value: 42 }])

  const lockedPrefix1 = docLock('user/', { value: 42 })
  const lockedPrefix2 = docLock('user/', { other: 'value' })
  const lockedPrefix3 = docLock('user/', [{ other: 'value' }, { value: 42 }])

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
