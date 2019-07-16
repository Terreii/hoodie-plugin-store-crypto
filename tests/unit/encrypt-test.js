'use strict'

var test = require('tape')

var encrypt = require('../../lib/encrypt')

test('encrypt should encrypt a document', function (t) {
  t.plan(6)

  var hoodiePart = {
    createdAt: new Date().toJSON()
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
    createdAt: new Date().toJSON()
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

test("shouldn't change the original object", function (t) {
  t.plan(3)

  var doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    hoodie: {
      createdAt: new Date().toJSON()
    },
    foo: 'bar',
    hello: 'world',
    day: 1
  }
  var key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')
  var docData = JSON.stringify(doc)

  encrypt(key, doc)

    .then(function (result) {
      t.equal(JSON.stringify(doc), docData, 'unchanged')
      t.equal(doc._id, 'hello', "_id didn't change")
      t.equal(doc._rev, '1-1234567890', "_rev didn't change")
    })
})

test('should ignore properties in ignore', function (t) {
  t.plan(6)

  var doc = {
    _id: 'hello',
    _rev: '2-1234567890',
    _deleted: false,
    _attachments: {
      'info.txt': {
        content_type: 'text/plain',
        digest: 'd5ccfd24a8748bed4e2c9a279a2b6089',
        data: 'SXMgdGhlcmUgbGlmZSBvbiBNYXJzPw=='
      }
    },
    _conflicts: [
      '2-0987654321'
    ],
    hoodie: {
      createdAt: new Date().toJSON()
    },
    foo: 'bar',
    hello: 'world',
    day: 1
  }
  var key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')

  encrypt(key, doc)

    .then(function (result) {
      t.equal(result._id, 'hello', "_id didn't change")
      t.equal(result._rev, '2-1234567890', "_rev didn't change")
      t.equal(result._deleted, false, "_deleted didn't change")
      t.equal(result._attachments, doc._attachments, "_attachments didn't change")
      t.equal(result._conflicts, doc._conflicts, "_conflicts didn't change")
      t.equal(result.hoodie, doc.hoodie, "hoodie didn't change")
    })
})
