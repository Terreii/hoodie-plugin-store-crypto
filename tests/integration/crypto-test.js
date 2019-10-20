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

    .catch(t.end)
})

test('members with an key used by this package should still be preserved', function (t) {
  t.plan(6)

  var password = 'test'
  var hoodiePart = {
    createdAt: Date.now()
  }
  var doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    hoodie: hoodiePart,
    value: 42,
    data: 'bar',
    tag: 'greetings',
    nonce: 1
  }
  var key = null

  createKey(password)

    .then(function (result) {
      key = result.key

      return encrypt({ key: key }, doc, null)
    })

    .then(function (encrypted) {
      t.isNot(encrypted.data, doc.data, 'data was encrypted')
      t.isNot(encrypted.tag, doc.tag, 'tag was encrypted')
      t.isNot(encrypted.nonce, doc.nonce, 'nonce was encrypted')

      return decrypt(key, encrypted)
    })

    .then(function (decrypted) {
      t.is(decrypted.data, doc.data, 'decrypted data has the original value')
      t.is(decrypted.tag, doc.tag, 'decrypted tag has the original value')
      t.is(decrypted.nonce, doc.nonce, 'decrypted nonce has the original value')
    })

    .catch(t.end)
})
