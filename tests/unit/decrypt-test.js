'use strict'

const test = require('tape')

const decrypt = require('../../lib/decrypt')

const browserTest = require('../utils/browser-test')

test('encrypt should encrypt a document', async t => {
  t.plan(1)

  const hoodiePart = {
    createdAt: Date.now()
  }
  const doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    hoodie: hoodiePart,
    tag: '6bc503f508a88e67f82aaf76406ac509',
    data: '1b16dfd5903880851103599e801b07ae915db7194f52d36b321b91bd822c232ade9572b39e',
    nonce: '433d5b039fbda3b75b0a7f56'
  }
  const key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')

  const decrypted = await decrypt(key, doc)

  t.deepEqual(decrypted, {
    _id: 'hello',
    _rev: '1-1234567890',
    hoodie: hoodiePart,
    foo: 'bar',
    hello: 'world',
    day: 1
  }, 'decrypted doc')
})

test('should return an un-encrypted document', async t => {
  t.plan(1)

  const doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    foo: 'bar',
    hello: 'world',
    day: 1
  }
  const key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')

  try {
    const decrypted = await decrypt(key, doc)

    t.deepEqual(decrypted, {
      _id: 'hello',
      _rev: '1-1234567890',
      foo: 'bar',
      hello: 'world',
      day: 1
    })
  } catch (err) {
    t.end(err)
  }
})

test('should throw with a TypeError if no key is passed', async t => {
  t.plan(1)

  const hoodiePart = {
    createdAt: Date.now()
  }
  const doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    hoodie: hoodiePart,
    tag: '6bc503f508a88e67f82aaf76406ac509',
    data: '1b16dfd5903880851103599e801b07ae915db7194f52d36b321b91bd822c232ade9572b39e',
    nonce: '433d5b039fbda3b75b0a7f56'
  }

  try {
    await decrypt(Buffer.from([]), doc)
    t.fail('should throw an TypeError')
  } catch (error) {
    t.is(error.name, 'TypeError')
  }
})

test('decrypt merges all not encrypted fields into the result object', async t => {
  t.plan(2)

  const hoodiePart = { createdAt: new Date().toJSON() }

  const doc = {
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
  const key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')

  try {
    const decrypted = await decrypt(key, doc)
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

    // testing overwriting of not encrypted fields
    doc.hello = 'Greetings'
    const decryptedWithPublicField = await decrypt(key, doc)

    t.deepEqual(decryptedWithPublicField, {
      _id: 'hello',
      _rev: '1-1234567890',
      hoodie: hoodiePart,
      foo: 'bar',
      hello: 'world',
      day: 1,
      value: 42,
      greetings: 'To you!'
    }, 'decrypted and merged doc with overwritten field')
  } catch (err) {
    t.end(err)
  }
})

test('decrypt should work in chrome', async t => {
  t.plan(1)

  try {
    const decryptedDoc = await browserTest('chrome', './lib/decrypt', 'decrypt', () => {
      const doc = {
        _id: 'hello',
        _rev: '1-1234567890',
        hoodie: {
          createdAt: '2019-12-18T23:12:43.568Z'
        },
        tag: '6bc503f508a88e67f82aaf76406ac509',
        data: '1b16dfd5903880851103599e801b07ae915db7194f52d36b321b91bd822c232ade9572b39e',
        nonce: '433d5b039fbda3b75b0a7f56'
      }

      const key = new Uint8Array(
        '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c'
          .match(/.{1,2}/g)
          .map(byte => parseInt(byte, 16))
      )
      return decrypt(key, doc)
    })

    t.deepEqual(decryptedDoc, {
      _id: 'hello',
      _rev: '1-1234567890',
      hoodie: {
        createdAt: '2019-12-18T23:12:43.568Z'
      },
      foo: 'bar',
      hello: 'world',
      day: 1
    }, 'decrypted doc')
  } catch (err) {
    t.end(err)
  }
})

test('decrypt should work in Firefox', async t => {
  t.plan(1)

  try {
    const decryptedDoc = await browserTest('chrome', './lib/decrypt', 'decrypt', () => {
      const doc = {
        _id: 'hello',
        _rev: '1-1234567890',
        hoodie: {
          createdAt: '2019-12-18T23:12:43.568Z'
        },
        tag: '6bc503f508a88e67f82aaf76406ac509',
        data: '1b16dfd5903880851103599e801b07ae915db7194f52d36b321b91bd822c232ade9572b39e',
        nonce: '433d5b039fbda3b75b0a7f56'
      }

      const key = new Uint8Array(
        '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c'
          .match(/.{1,2}/g)
          .map(byte => parseInt(byte, 16))
      )
      return decrypt(key, doc)
    })

    t.deepEqual(decryptedDoc, {
      _id: 'hello',
      _rev: '1-1234567890',
      hoodie: {
        createdAt: '2019-12-18T23:12:43.568Z'
      },
      foo: 'bar',
      hello: 'world',
      day: 1
    }, 'decrypted doc')
  } catch (err) {
    t.end(err)
  }
})
