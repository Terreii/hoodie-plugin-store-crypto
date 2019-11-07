'use strict'

const test = require('tape')

const lock = require('../../lib/lock')

test('lock should set the key and salt to null', t => {
  t.plan(3)

  const state = {
    key: Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex'),
    salt: 'bf11fa9bafca73586e103d60898989d4'
  }

  const result = lock(state)

  t.is(state.key, null, 'key was set to null')
  t.is(state.salt, null, 'salt was set to null')
  t.is(result, true, 'returns true if it did lock the store')
})

test('lock should be save to call multiple times', t => {
  t.plan(4)

  const state = {}

  const firstResult = lock(state)

  t.is(firstResult, false, 'returns false if the state wasn\'t unlocked')

  const secondResult = lock(state)

  t.is(secondResult, false, 'it is save to call a second time')

  state.key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')
  state.salt = 'bf11fa9bafca73586e103d60898989d4'

  const thirdResult = lock(state)

  t.is(thirdResult, true, 'returns true if it did lock the store')

  const fourthResult = lock(state)

  t.is(fourthResult, false, 'it is save to call a second time')
})
