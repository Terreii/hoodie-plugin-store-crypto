'use strict'

var test = require('tape')

var createKey = require('../../lib/create-key')
var encrypt = require('../../lib/encrypt')
var decrypt = require('../../lib/decrypt')

test('test generating a key and encrypt and decrypt a doc with it', function (t) {
  t.plan(1)

  var password = 'test'
  var hoodiePart = {
    createdAt: Date.now()
  }
  var doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    hoodie: hoodiePart,
    foo: 'bar',
    hello: 'world',
    day: 1
  }

  createKey(password)

    .then(function (result) {
      var key = result.key

      return encrypt({ key: key }, doc, null)

        .then(function (encrypted) {
          return {
            key: key,
            encrypted: encrypted
          }
        })
    })

    .then(function (result) {
      var key = result.key
      var encrypted = result.encrypted

      return decrypt(key, encrypted)
    })

    .then(function (decrypted) {
      t.deepEqual(decrypted, {
        _id: 'hello',
        _rev: '1-1234567890',
        hoodie: hoodiePart,
        foo: 'bar',
        hello: 'world',
        day: 1
      }, 'decrypted doc')
    })

    .catch(function (error) {
      t.error(error)
    })
})
