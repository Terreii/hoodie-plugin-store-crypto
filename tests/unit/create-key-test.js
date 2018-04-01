'use strict'

var test = require('tape')

var createKey = require('../../lib/create-key')

test('create a key', function (t) {
  t.plan(2)

  var password = 'test'

  createKey(password, 'bf11fa9bafca73586e103d60898989d4')

    .then(function (result) {
      t.equal(
        result.key.toString('hex'),
        '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c',
        'generated key from password "test" with salt "bf11fa9bafca73586e103d60898989d4"'
      )

      t.equal(result.salt, 'bf11fa9bafca73586e103d60898989d4', 'returned salt')
    })
})

test('create a key and salt if no salt was passed', function (t) {
  t.plan(2)

  var password = 'test'

  createKey(password)

    .then(function (result) {
      t.ok(result.key.length > 0, 'generated key')

      t.ok(result.salt.length === 32, 'generated salt')
    })
})
