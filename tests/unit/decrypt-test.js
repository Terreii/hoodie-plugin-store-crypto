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

  .then(function (encrypted) {
    t.deepEqual(encrypted, {
      _id: 'hello',
      _rev: '1-1234567890',
      hoodie: hoodiePart,
      foo: 'bar',
      hello: 'world',
      day: 1
    }, 'decrypted doc')
  })
})
