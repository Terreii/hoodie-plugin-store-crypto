'use strict'

var test = require('tape')

var encrypt = require('../../lib/encrypt')

test('encrypt should encrypt a document', function (t) {
  t.plan(6)

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
  var key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')

  encrypt(key, doc, null)

  .then(function (encrypted) {
    t.equal(encrypted._id, 'hello', 'unchanged _id')
    t.equal(encrypted._rev, '1-1234567890', 'unchanged _rev')
    t.deepEqual(encrypted.hoodie, hoodiePart, 'unchanged hoodie data')
    t.ok(encrypted.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encrypted.data.length > 0, 'encrypted data')
    t.ok(encrypted.nonce.length === 24, 'nonce should have a length of 24')
  })
})

test('should throw with a TypeError if no key is passed', function (t) {
  t.plan(1)

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

  encrypt(Buffer.from([]), doc)

  .then(function (decrypted) {
    t.fail('should throw an TypeError')
  })

  .catch(function (error) {
    t.is(error.name, 'TypeError')
  })
})
