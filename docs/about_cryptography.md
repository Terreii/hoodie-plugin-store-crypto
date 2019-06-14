| [index](../README.md) | [API](./api.md) | about cryptography | [update](./update.md) | [Contributing](../CONTRIBUTING.md) | [Code of Conduct](../CODE_OF_CONDUCT.md) |
|-----------------------|-----------------|--------------------|-----------------------|-----------------------------------|------------------------------------------|

# About the cryptography

This plugin uses the `sha256` and `pbkdf2` algorithms for generating a key from your password. The key is a 32 char Hash. And for encryption and decryption of your docs the `AES-GCM` algorithm gets used.

## What is encrypted

Hoodie, CouchDB and PouchDB need `_id`, `_rev`, `_deleted`, `_attachments` and `_conflicts` to function. They and the content of the `hoodie` object, are **not encrypted**!
Everything else goes through `JSON.stringify` and gets encrypted.

This includes all fields of old documents. Those fields will then get deleted!

**_Please be aware, that the `_id` of a doc is not encrypted! Don't store important or personal information in the `_id`!_**

## Derive key from password and salt

```javascript
var pbkdf2 = require('native-crypto/pbkdf2')
var randomBytes = require('randombytes')

async function deriveKey (password) {
  const doc = await hoodie.store.find('hoodiePluginCryptoStore/salt')

  const digest = 'sha256'
  const iterations = 100000
  const salt = doc.salt != null && typeof doc.salt === 'string' && doc.salt.length === 32
    ? doc.salt
    : randomBytes(16).toString('hex')

  const key = await pbkdf2(password, Buffer.from(salt, 'hex'), iterations, 256 / 8, digest)

  return {
    key: key,
    salt: salt
  }
}
```

## Encrypt a document

```javascript
var encrypt = require('native-crypto/encrypt')
var randomBytes = require('randombytes')

var ignore = [
  '_id',
  '_rev',
  '_deleted',
  '_attachments',
  '_conflicts',
  'hoodie'
]

async function encryptDoc (key, doc) {
  var nonce = randomBytes(12)
  var outDoc = {
    nonce: nonce.toString('hex')
  }

  ignore.forEach(function (key) {
    outDoc[key] = doc[key]
    delete doc[key]
  })

  var data = JSON.stringify(doc)
  const response = await encrypt(key, nonce, data, Buffer.from(outDoc._id))

  outDoc.tag = response.slice(-16).toString('hex')
  outDoc.data = response.slice(0, -16).toString('hex')

  return outDoc
}
```

## Decrypt a document

```javascript
var decrypt = require('native-crypto/decrypt')

var ignore = [
  '_id',
  '_rev',
  '_deleted',
  '_attachments',
  '_conflicts',
  'hoodie'
]

async function decryptDoc (key, doc) {
  var data = Buffer.from(doc.data, 'hex')
  var tag = Buffer.from(doc.tag, 'hex')
  var encryptedData = Buffer.concat([data, tag])

  var nonce = Buffer.from(doc.nonce, 'hex')
  var aad = Buffer.from(doc._id)

  const outData = await decrypt(key, nonce, encryptedData, aad)
  var out = JSON.parse(outData)

  ignore.forEach(function (key) {
    var ignoreValue = doc[key]

    if (ignoreValue !== undefined) {
      out[key] = ignoreValue
    }
  })

  return out
}
```
