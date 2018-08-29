'use strict'

var test = require('tape')

var lock = require('../../lib/lock')

test('lock should set the key and salt to null', function (t) {
  t.plan(3)

  var state = {
    key: Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex'),
    salt: 'bf11fa9bafca73586e103d60898989d4'
  }

  var result = lock(state)

  t.is(state.key, null, 'key was set to null')
  t.is(state.salt, null, 'salt was set to null')
  t.is(result, true, 'returns true if it did lock the store')
})

test('lock should be save to call multiple times', function (t) {
  t.plan(4)

  var state = {}

  var firstResult = lock(state)

  t.is(firstResult, false, 'returns false if the state wasn\'t unlocked')

  var secondResult = lock(state)

  t.is(secondResult, false, 'it is save to call a second time')

  state.key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')
  state.salt = 'bf11fa9bafca73586e103d60898989d4'

  var thirdResult = lock(state)

  t.is(thirdResult, true, 'returns true if it did lock the store')

  var fourthResult = lock(state)

  t.is(fourthResult, false, 'it is save to call a second time')
})
