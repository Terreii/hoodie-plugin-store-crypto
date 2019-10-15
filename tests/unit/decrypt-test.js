'use strict'

var test = require('tape')

var decrypt = require('../../lib/decrypt')

test('encrypt should encrypt a document', function (t) {
  t.plan(1)

  var hoodiePart = {
    createdAt: Date.now()
  }
  var doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    hoodie: hoodiePart,
    tag: '6bc503f508a88e67f82aaf76406ac509',
    data: '1b16dfd5903880851103599e801b07ae915db7194f52d36b321b91bd822c232ade9572b39e',
    nonce: '433d5b039fbda3b75b0a7f56'
  }
  var key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')

  decrypt(key, doc)

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
})

test('should return an un-encrypted document', function (t) {
  t.plan(1)

  var doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    foo: 'bar',
    hello: 'world',
    day: 1
  }
  var key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')

  decrypt(key, doc)

    .then(function (decrypted) {
      t.deepEqual(doc, {
        _id: 'hello',
        _rev: '1-1234567890',
        foo: 'bar',
        hello: 'world',
        day: 1
      })
    })

    .catch(function () {
      t.fail('should return the doc')
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
    tag: '6bc503f508a88e67f82aaf76406ac509',
    data: '1b16dfd5903880851103599e801b07ae915db7194f52d36b321b91bd822c232ade9572b39e',
    nonce: '433d5b039fbda3b75b0a7f56'
  }

  decrypt(Buffer.from([]), doc)

    .then(function (decrypted) {
      t.fail('should throw an TypeError')
    })

    .catch(function (error) {
      t.is(error.name, 'TypeError')
    })
})

test('decrypt merges all not encrypted fields into the result object', function (t) {
  t.plan(1)

  var hoodiePart = { createdAt: new Date().toJSON() }

  var doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    hoodie: hoodiePart,
    tag: '6bc503f508a88e67f82aaf76406ac509',
    data: '1b16dfd5903880851103599e801b07ae915db7194f52d36b321b91bd822c232ade9572b39e',
    nonce: '433d5b039fbda3b75b0a7f56',

    // not encrypted
    value: 42,
    greetings: 'To you!'
  }
  var key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')

  decrypt(key, doc)

    .then(function (decrypted) {
      t.deepEqual(decrypted, {
        _id: 'hello',
        _rev: '1-1234567890',
        hoodie: hoodiePart,
        foo: 'bar',
        hello: 'world',
        day: 1,
        value: 42,
        greetings: 'To you!'
      }, 'decrypted and merged doc')
    })

    .catch(t.end)
})
