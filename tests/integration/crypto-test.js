'use strict'

const test = require('tape')

const createKey = require('../../lib/create-key')
const encrypt = require('../../lib/encrypt-doc')
const decrypt = require('../../lib/decrypt-doc')

test('test generating a key and encrypt and decrypt a doc with it', async t => {
  t.plan(1)

  const password = 'test'
  const hoodiePart = {
    createdAt: new Date().toJSON()
  }
  const doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    hoodie: hoodiePart,
    foo: 'bar',
    hello: 'world',
    day: 1
  }

  try {
    const { key } = await createKey(password)
    const encrypted = await encrypt({ key }, doc, null)
    const decrypted = await decrypt(key, encrypted)

    t.deepEqual(decrypted, {
      _id: 'hello',
      _rev: '1-1234567890',
      hoodie: hoodiePart,
      foo: 'bar',
      hello: 'world',
      day: 1
    }, 'decrypted doc')
  } catch (err) {
    t.end(err)
  }
})

test('members with an key used by this package should still be preserved', async t => {
  t.plan(6)

  const password = 'test'
  const hoodiePart = {
    createdAt: Date.now()
  }
  const doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    hoodie: hoodiePart,
    value: 42,
    data: 'bar',
    tag: 'greetings',
    nonce: 1
  }

  try {
    const { key } = await createKey(password)

    const encrypted = await encrypt({ key }, doc, null)
    t.isNot(encrypted.data, doc.data, 'data was encrypted')
    t.isNot(encrypted.tag, doc.tag, 'tag was encrypted')
    t.isNot(encrypted.nonce, doc.nonce, 'nonce was encrypted')

    const decrypted = await decrypt(key, encrypted)
    t.is(decrypted.data, doc.data, 'decrypted data has the original value')
    t.is(decrypted.tag, doc.tag, 'decrypted tag has the original value')
    t.is(decrypted.nonce, doc.nonce, 'decrypted nonce has the original value')
  } catch (err) {
    t.end(err)
  }
})
