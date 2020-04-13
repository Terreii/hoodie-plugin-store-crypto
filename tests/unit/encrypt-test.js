'use strict'

const test = require('tape')

const encrypt = require('../../lib/encrypt-doc')

const browserTest = require('../utils/browser-test')

test('encrypt should encrypt a document', async t => {
  t.plan(6)

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
  const key = Buffer.from(
    '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c',
    'hex'
  )

  try {
    const encrypted = await encrypt({ key }, doc, null)

    t.equal(encrypted._id, 'hello', 'unchanged _id')
    t.equal(encrypted._rev, '1-1234567890', 'unchanged _rev')
    t.deepEqual(encrypted.hoodie, hoodiePart, 'unchanged hoodie data')
    t.ok(encrypted.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encrypted.data.length > 0, 'encrypted data')
    t.ok(encrypted.nonce.length === 24, 'nonce should have a length of 24')
  } catch (err) {
    t.end(err)
  }
})

test('should throw with a TypeError if no key is passed', async t => {
  t.plan(1)

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
    await encrypt({ key: Buffer.from([]) }, doc)
    t.fail('should throw an TypeError')
  } catch (error) {
    t.is(error.name, 'TypeError')
  }
})

test("shouldn't change the original object", async t => {
  t.plan(3)

  const doc = {
    _id: 'hello',
    _rev: '1-1234567890',
    hoodie: {
      createdAt: new Date().toJSON()
    },
    foo: 'bar',
    hello: 'world',
    day: 1
  }
  const key = Buffer.from(
    '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c',
    'hex'
  )
  const docData = JSON.stringify(doc)

  try {
    await encrypt({ key }, doc)

    t.equal(JSON.stringify(doc), docData, 'unchanged')
    t.equal(doc._id, 'hello', "_id didn't change")
    t.equal(doc._rev, '1-1234567890', "_rev didn't change")
  } catch (err) {
    t.end(err)
  }
})

test('should ignore properties in ignore of this package', async t => {
  t.plan(6)

  const doc = {
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
  const key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')

  try {
    const result = await encrypt({ key }, doc)

    t.equal(result._id, 'hello', "_id didn't change")
    t.equal(result._rev, '2-1234567890', "_rev didn't change")
    t.equal(result._deleted, false, "_deleted didn't change")
    t.equal(result._attachments, doc._attachments, "_attachments didn't change")
    t.equal(result._conflicts, doc._conflicts, "_conflicts didn't change")
    t.equal(result.hoodie, doc.hoodie, "hoodie didn't change")
  } catch (err) {
    t.end(err)
  }
})

test('encrypt should ignore fields that are listed in the passed obj.cy_ignore', async t => {
  t.plan(12)

  const doc = {
    cy_ignore: ['value', 'other', 'not_existing'],
    value: 42,
    shouldEncrypt: 128,
    other: 'not encrypted',
    secret: 'top secret'
  }
  const key = Buffer.from('8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c', 'hex')

  try {
    const result = await encrypt({ key }, doc)

    t.equal(result.value, 42, "didn't encrypt value")
    t.equal(result.other, 'not encrypted', "didn't encrypt other")
    t.equal(result.shouldEncrypt, undefined, 'did encrypt shouldEncrypt')
    t.equal(result.secret, undefined, 'did encrypt secret')
    t.equal(result.not_existing, undefined, 'not_existing does not exist')
    t.equal(result.cy_ignore, undefined, 'cy_ignore is encrypted')

    doc.cy_ignore.push('cy_ignore')
    const resultIgnoreCyIgnore = await encrypt({ key }, doc)

    t.equal(resultIgnoreCyIgnore.value, 42, "didn't encrypt value")
    t.equal(resultIgnoreCyIgnore.other, 'not encrypted', "didn't encrypt other")
    t.equal(resultIgnoreCyIgnore.shouldEncrypt, undefined, 'did encrypt shouldEncrypt')
    t.equal(resultIgnoreCyIgnore.secret, undefined, 'did encrypt secret')
    t.equal(resultIgnoreCyIgnore.not_existing, undefined, 'not_existing does not exist')
    t.deepEqual(
      resultIgnoreCyIgnore.cy_ignore,
      ['value', 'other', 'not_existing', 'cy_ignore'],
      'cy_ignore is ignored but added'
    )
  } catch (err) {
    t.end(err)
  }
})

test(
  'encrypt should ignore fields that are listed in the passed and temp obj.__cy_ignore',
  async t => {
    t.plan(13)

    const doc = {
      __cy_ignore: ['value', 'other', 'not_existing'],
      value: 42,
      shouldEncrypt: 128,
      other: 'not encrypted',
      secret: 'top secret'
    }
    const key = Buffer.from(
      '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c',
      'hex'
    )

    try {
      const result = await encrypt({ key }, doc)

      t.equal(result.value, 42, "didn't encrypt value")
      t.equal(result.other, 'not encrypted', "didn't encrypt other")
      t.equal(result.shouldEncrypt, undefined, 'did encrypt shouldEncrypt')
      t.equal(result.secret, undefined, 'did encrypt secret')
      t.equal(result.not_existing, undefined, 'not_existing does not exist')
      t.equal(result.__cy_ignore, undefined, '__cy_ignore does not exist')

      doc.__cy_ignore.push('cy_ignore')
      doc.__cy_ignore.push('__cy_ignore')
      const resultIgnore = await encrypt({ key }, doc)

      t.equal(resultIgnore.value, 42, "didn't encrypt value")
      t.equal(resultIgnore.other, 'not encrypted', "didn't encrypt other")
      t.equal(resultIgnore.shouldEncrypt, undefined, 'did encrypt shouldEncrypt')
      t.equal(resultIgnore.secret, undefined, 'did encrypt secret')
      t.equal(resultIgnore.not_existing, undefined, 'not_existing does not exist')
      t.equal(resultIgnore.__cy_ignore, undefined, '__cy_ignore is not added')
      t.equal(resultIgnore.cy_ignore, undefined, 'cy_ignore does not exist')
    } catch (err) {
      t.end(err)
    }
  }
)

test('encrypt should ignore special design-doc fields on design-docs', async t => {
  t.plan(55)

  const doc = {
    _id: '_design/test',
    shouldEncrypt: 128,
    language: 'javascript',
    options: {
      some: 'option'
    },
    filters: {
      is_encrypted: function (doc, req) { return doc.nonce && doc.tag && doc.data }.toString()
    },
    lists: {
      table: `function (head, req) {
        start({
          headers: {
            'Content-Type': 'text/html'
          }
        })
        send('<html><body><table>')
        send('<tr><th>ID</th><th>Key</th><th>Value</th></tr>')
        var row
        while (row = getRow()) {
          send(''.concat(
            '<tr>',
            '<td>' + toJSON(row.id) + '</td>',
            '<td>' + toJSON(row.key) + '</td>',
            '<td>' + toJSON(row.value) + '</td>',
            '</tr>'
          ))
        }
        send('</table></body></html>')
      }`
    },
    rewrites: 'function () { something }',
    shows: {
      greeting: function (doc, req) {
        if (doc) {
          return 'Hello from ' + doc._id + '!'
        } else {
          return 'Hello, world!'
        }
      }.toString()
    },
    updates: {
      add_greeting: function (doc, req) {
        doc.greeting = 'Hello from ' + doc._id + '!'
        return [doc, 'Did add greeting!']
      }.toString()
    },
    validate_doc_update: `function (newDoc, oldDoc, userCtx, secObj) {
      if (oldDoc.owner !== userCtx.name && userCtx.roles.indexOf('_admin') === -1) {
        throw({ forbidden: 'Only admins and users can update their document!' })
      }
    }`,
    views: {
      encrypted: {
        view: function (doc) { return doc.nonce && doc.tag && doc.data }.toString()
      }
    },
    autoupdate: true
  }
  const key = Buffer.from(
    '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c',
    'hex'
  )

  try {
    const checkDoc = JSON.parse(JSON.stringify(doc))
    const result = await encrypt({ key }, doc)

    t.equal(result.shouldEncrypt, undefined, 'did encrypt shouldEncrypt with no prefix')
    t.equal(result.language, 'javascript', 'language was not encrypted with no prefix')
    t.deepEqual(result.options, checkDoc.options, 'options was not encrypted with no prefix')
    t.deepEqual(result.filters, checkDoc.filters, 'filters was not encrypted with no prefix')
    t.deepEqual(result.lists, checkDoc.lists, 'lists was not encrypted with no prefix')
    t.equal(result.rewrites, checkDoc.rewrites, 'rewrites was not encrypted with no prefix')
    t.deepEqual(result.shows, checkDoc.shows, 'shows was not encrypted with no prefix')
    t.deepEqual(result.updates, checkDoc.updates, 'updates was not encrypted with no prefix')
    t.equal(
      result.validate_doc_update,
      checkDoc.validate_doc_update,
      'validate_doc_update was not encrypted with no prefix'
    )
    t.deepEqual(result.views, checkDoc.views, 'views was not encrypted with no prefix')
    t.equal(result.autoupdate, true, 'autoupdate was not encrypted with no prefix')

    doc._id = 'test'
    const resultWithPrefix = await encrypt({ key }, doc, '_design/')

    t.equal(resultWithPrefix.shouldEncrypt, undefined, 'did encrypt shouldEncrypt with prefix')
    t.equal(resultWithPrefix.language, 'javascript', 'language was not encrypted with prefix')
    t.deepEqual(resultWithPrefix.options, checkDoc.options, 'options was not encrypted with prefix')
    t.deepEqual(resultWithPrefix.filters, checkDoc.filters, 'filters was not encrypted with prefix')
    t.deepEqual(resultWithPrefix.lists, checkDoc.lists, 'lists was not encrypted with prefix')
    t.equal(resultWithPrefix.rewrites, checkDoc.rewrites, 'rewrites was not encrypted with prefix')
    t.deepEqual(resultWithPrefix.shows, checkDoc.shows, 'shows was not encrypted with prefix')
    t.deepEqual(resultWithPrefix.updates, checkDoc.updates, 'updates was not encrypted with prefix')
    t.equal(
      resultWithPrefix.validate_doc_update,
      checkDoc.validate_doc_update,
      'validate_doc_update was not encrypted with prefix'
    )
    t.deepEqual(resultWithPrefix.views, checkDoc.views, 'views was not encrypted with prefix')
    t.equal(resultWithPrefix.autoupdate, true, 'autoupdate was not encrypted with prefix')

    doc._id = '_design/test'
    const resultWithPrefixAndId = await encrypt({ key }, doc, '_design/')

    t.equal(
      resultWithPrefixAndId.shouldEncrypt,
      undefined,
      'did encrypt shouldEncrypt with prefix and id'
    )
    t.equal(
      resultWithPrefixAndId.language,
      'javascript',
      'language was not encrypted with prefix and id'
    )
    t.deepEqual(
      resultWithPrefixAndId.options,
      checkDoc.options,
      'options was not encrypted with prefix and id'
    )
    t.deepEqual(
      resultWithPrefixAndId.filters,
      checkDoc.filters,
      'filters was not encrypted with prefix and id'
    )
    t.deepEqual(
      resultWithPrefixAndId.lists,
      checkDoc.lists,
      'lists was not encrypted with prefix and id'
    )
    t.equal(
      resultWithPrefixAndId.rewrites,
      checkDoc.rewrites,
      'rewrites was not encrypted with prefix and id'
    )
    t.deepEqual(
      resultWithPrefixAndId.shows,
      checkDoc.shows,
      'shows was not encrypted with prefix and id'
    )
    t.deepEqual(
      resultWithPrefixAndId.updates,
      checkDoc.updates,
      'updates was not encrypted with prefix and id'
    )
    t.equal(
      resultWithPrefixAndId.validate_doc_update,
      checkDoc.validate_doc_update,
      'validate_doc_update was not encrypted with prefix and id'
    )
    t.deepEqual(
      resultWithPrefixAndId.views,
      checkDoc.views,
      'views was not encrypted with prefix and id'
    )
    t.equal(
      resultWithPrefixAndId.autoupdate,
      true,
      'autoupdate was not encrypted with prefix and id'
    )

    doc._id = 'not_design'
    const resultNotDesign = await encrypt({ key }, doc)

    t.equal(
      resultNotDesign.shouldEncrypt,
      undefined,
      'did encrypt shouldEncrypt not design no prefix'
    )
    t.equal(resultNotDesign.language, undefined, 'did encrypt language not design no prefix')
    t.deepEqual(resultNotDesign.options, undefined, 'did encrypt options not design no prefix')
    t.deepEqual(resultNotDesign.filters, undefined, 'did encrypt filters not design no prefix')
    t.deepEqual(resultNotDesign.lists, undefined, 'did encrypt lists not design no prefix')
    t.equal(resultNotDesign.rewrites, undefined, 'did encrypt rewrites not design no prefix')
    t.deepEqual(resultNotDesign.shows, undefined, 'did encrypt shows not design no prefix')
    t.deepEqual(resultNotDesign.updates, undefined, 'did encrypt updates not design no prefix')
    t.equal(
      resultNotDesign.validate_doc_update,
      undefined,
      'did encrypt validate_doc_update not design no prefix'
    )
    t.deepEqual(resultNotDesign.views, undefined, 'did encrypt views not design no prefix')
    t.equal(resultNotDesign.autoupdate, undefined, 'did encrypt autoupdate not design no prefix')

    doc._id = '_design'
    const resultNotDesignByPrefix = await encrypt({ key }, doc, 'not_design')

    t.equal(
      resultNotDesignByPrefix.shouldEncrypt,
      undefined,
      'did encrypt shouldEncrypt id=design with prefix'
    )
    t.equal(
      resultNotDesignByPrefix.language,
      undefined,
      'did encrypt language id=design with prefix'
    )
    t.equal(resultNotDesignByPrefix.options, undefined, 'did encrypt options id=design with prefix')
    t.equal(resultNotDesignByPrefix.filters, undefined, 'did encrypt filters id=design with prefix')
    t.equal(resultNotDesignByPrefix.lists, undefined, 'did encrypt lists id=design with prefix')
    t.equal(
      resultNotDesignByPrefix.rewrites,
      undefined,
      'did encrypt rewrites id=design with prefix'
    )
    t.equal(resultNotDesignByPrefix.shows, undefined, 'did encrypt shows id=design with prefix')
    t.equal(resultNotDesignByPrefix.updates, undefined, 'did encrypt updates id=design with prefix')
    t.equal(
      resultNotDesignByPrefix.validate_doc_update,
      undefined,
      'did encrypt validate_doc_update id=design with prefix'
    )
    t.equal(resultNotDesignByPrefix.views, undefined, 'did encrypt views id=design with prefix')
    t.equal(
      resultNotDesignByPrefix.autoupdate,
      undefined,
      'did encrypt autoupdate id=design with prefix'
    )
  } catch (err) {
    t.end(err)
  }
})

test(
  'encrypt does not encrypt fields starting with _ if handleSpecialMembers is true',
  async t => {
    t.plan(3)

    const doc = {
      _access: ['user_id'],
      value: 42,
      _shouldBePublic: 128
    }
    const key = Buffer.from(
      '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c',
      'hex'
    )

    try {
      const result = await encrypt({ key, handleSpecialMembers: true }, doc, null)

      t.deepEqual(result._access, ['user_id'], '_access is not encrypted')
      t.is(result.value, undefined, 'values are encrypted')
      t.is(result._shouldBePublic, 128, 'value starting with _ is not encrypted')
    } catch (err) {
      t.end(err)
    }
  }
)

test('encryption works in chrome', async t => {
  t.plan(9)

  try {
    const encryptedDoc = await browserTest('chrome', './lib/encrypt-doc', 'encrypt', () => {
      const doc = {
        _id: 'hello',
        _rev: '1-1234567890',
        hoodie: {
          createdAt: '2019-12-18T23:12:43.568Z'
        },
        foo: 'bar',
        hello: 'world',
        day: 1
      }
      const key = new Uint8Array(
        '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c'
          .match(/.{1,2}/g)
          .map(byte => parseInt(byte, 16))
      )
      return encrypt({ key }, doc, null)
    })

    t.is(encryptedDoc._id, 'hello', 'unchanged _id')
    t.is(encryptedDoc._rev, '1-1234567890', 'unchanged _rev')
    t.deepEqual(
      encryptedDoc.hoodie,
      { createdAt: '2019-12-18T23:12:43.568Z' },
      'unchanged hoodie data'
    )
    t.ok(encryptedDoc.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encryptedDoc.data.length > 0, 'encrypted data')
    t.ok(encryptedDoc.nonce.length === 24, 'nonce should have a length of 24')
    t.is(encryptedDoc.foo, undefined, "foo doesn't exist")
    t.is(encryptedDoc.hello, undefined, "hello doesn't exist")
    t.is(encryptedDoc.day, undefined, "day doesn't exist")
  } catch (err) {
    t.end(err)
  }
})

test('encryption works in Firefox', async t => {
  t.plan(9)

  try {
    const encryptedDoc = await browserTest('firefox', './lib/encrypt-doc', 'encrypt', () => {
      const doc = {
        _id: 'hello',
        _rev: '1-1234567890',
        hoodie: {
          createdAt: '2019-12-18T23:12:43.568Z'
        },
        foo: 'bar',
        hello: 'world',
        day: 1
      }
      const key = new Uint8Array(
        '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c'
          .match(/.{1,2}/g)
          .map(byte => parseInt(byte, 16))
      )
      return encrypt({ key }, doc, null)
    })

    t.is(encryptedDoc._id, 'hello', 'unchanged _id')
    t.is(encryptedDoc._rev, '1-1234567890', 'unchanged _rev')
    t.deepEqual(
      encryptedDoc.hoodie,
      { createdAt: '2019-12-18T23:12:43.568Z' },
      'unchanged hoodie data'
    )
    t.ok(encryptedDoc.tag.length === 32, 'tag part should have a length of 32')
    t.ok(encryptedDoc.data.length > 0, 'encrypted data')
    t.ok(encryptedDoc.nonce.length === 24, 'nonce should have a length of 24')
    t.is(encryptedDoc.foo, undefined, "foo doesn't exist")
    t.is(encryptedDoc.hello, undefined, "hello doesn't exist")
    t.is(encryptedDoc.day, undefined, "day doesn't exist")
  } catch (err) {
    t.end(err)
  }
})
