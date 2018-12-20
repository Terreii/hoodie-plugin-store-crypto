# hoodie-plugin-store-crypto
> End-to-end crypto plugin for the Hoodie client store.

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.com/Terreii/hoodie-plugin-store-crypto.svg?token=FkVUWJx8T235m9RhFUzT&branch=latest)](https://travis-ci.com/Terreii/hoodie-plugin-store-crypto)
[![dependencies Status](https://david-dm.org/Terreii/hoodie-plugin-store-crypto/status.svg)](https://david-dm.org/Terreii/hoodie-plugin-store-crypto)
[![devDependencies Status](https://david-dm.org/Terreii/hoodie-plugin-store-crypto/dev-status.svg)](https://david-dm.org/Terreii/hoodie-plugin-store-crypto?type=dev)
[![Greenkeeper badge](https://badges.greenkeeper.io/Terreii/hoodie-plugin-store-crypto.svg)](https://greenkeeper.io/)

This [Hoodie](http://hood.ie/) plugin adds methods, to add, read, update and delete encrypted
documents in your users store, while still being able to add, read, update and delete unencrypted
documents.

It does this by adding an object to your Hoodie-client, with similar methods
to the client's store. Those methods encrypt and decrypt objects, while using the
corresponding methods from Hoodie to save them.

There is no server side to this plugin!

**Everything of a doc will be encrypted, except `_id`, `_rev`, `_deleted`, `_attachments`, `_conflicts` and the `hoodie` object!**

## Example
```js
hoodie.store.add({foo: 'bar'})
  .then(function (obj) {console.log(obj)})

hoodie.cryptoStore.setup('secret')
  .then(async () => {
    const salt = await hoodie.cryptoStore.unlock('secret')

    const obj = await hoodie.cryptoStore.add({foo: 'bar'})  // adds the object encrypted
    console.log(obj)                                        // returns it unencrypted!
  })
```

## Update notes

[Please read the update notes for migrating from v1 to v2!](#v2-update-notes)

## Acknowledgments
This project heavily uses code and is inspired by
[@calvinmetcalf's crypto-pouch](https://github.com/calvinmetcalf/crypto-pouch)
and Hoodie's [hoodie-store-client](https://github.com/hoodiehq/hoodie-store-client).

A huge thank you to those projects and their maintainers.

- To result the same behavior, many of the tests in this plugin are adjusted versions of [hoodie-store-client](https://github.com/hoodiehq/hoodie-store-client) tests.
- The Encryption used here are adjusted versions of [@calvinmetcalf's crypto-pouch's](https://github.com/calvinmetcalf/crypto-pouch) encryption functions.

## Usage

There are 2 ways to use this plugin in your app:
- Use it with the Hoodie Plugin API
- Use it with a bundler (Webpack or Browserify)

### Usage with the Hoodie Plugin API

This will add the cryptoStore to your `/hoodie/client.js` if you use the `hoodie` package.

First, install the plugin as dependency of your Hoodie app:

```js
npm install --save hoodie-plugin-store-crypto
```

Then add it to the `hoodie.plugins` array in your app’s `package.json` file.

```json
{
  "name": "your-hoodie-app",
  ...
  "hoodie": {
    "plugins": [
      "hoodie-plugin-store-crypto"
    ]
  }
}
```

You can now start your app with `npm start`. There should now be an `cryptoStore`
property on your client `hoodie` instance. You can access it with
`hoodie.cryptoStore`.

### Usage with Browserify or Webpack

If you are using a client bundler (e.g. [Browserify](http://browserify.org/)
or [Webpack](https://webpack.js.org)), then you can import it manually.

First, install the plugin as dev-dependency of your Hoodie app:

```js
npm install --save-dev hoodie-plugin-store-crypto
```

Then require it and set it up:

```javascript
var Hoodie = require('@hoodie/client')
var PouchDB = require('pouchdb')
var cryptoStore = require('hoodie-plugin-store-crypto')

var hoodie = new Hoodie({ // create an instance of the hoodie-client
  url: '',
  PouchDB: PouchDB
})

cryptoStore(hoodie) // sets up hoodie.cryptoStore
```

You only need to do it this way, if you directly require/import the `@hoodie/client`!
If you get the client with `<script src="/hoodie/client.js"></script>`, then the first way is recommended.

### Get started

To use the cryptoStore you need to set a password for encryption. This can be your users password to
your app, or a special password, which they will enter or you generate.

There are 4 use-cases you must implement:

- [Sign up / setup / start of using encryption](#setup)
- [Sign in](#sign-in)
- [Open a tap/instance of your web-app if they are already signed in](#open-your-app-while-signed-in)
- [changing the password for encryption](#changing-the-password)

#### Setup

The first use of the cryptoStore. This is usually in your sign up function, but can also be done if
you newly added this plugin.

[`cryptoStore.setup(password, [salt])`](#cryptostoresetuppassword) is used to set the
encryption password. __`cryptoStore.setup(password, [salt])` will not unlock your cryptoStore instance__
(just like hoodie.account.signUp)!

A salt is a second part of a password. `cryptoStore.setup(password, [salt])` will save the generated salt in `hoodiePluginCryptoStore/salt`,
and use it.

Example:
```javascript
async function signUp (username, password, cryptoPassword) {
  const accountProperties = await hoodie.account.signUp({
    username: username,
    password: password
  })

  await hoodie.cryptoStore.setup(cryptoPassword)

  return signIn(username, password, cryptoPassword) // Call your signIn function
}
```

#### Sign in

Every time your user signs in you also need to unlock the cryptoStore.

[`cryptoStore.unlock(password)`](#cryptostoreunlockpassword) is used for unlocking.

`unlock` will try to pull `hoodiePluginCryptoStore/salt` from the server, 
to have the latest version of it.

Example:
```javascript
async function signIn (username, password, cryptoPassword) {
  const accountProperties = await hoodie.account.signIn({
    username: username,
    password: password
  })

  await hoodie.cryptoStore.unlock(cryptoPassword)

  // now do what you do after sign in.
}
```

#### Sign out

The `cryptoStore` listen automatically to [`hoodie.account.on('signout')`](http://docs.hood.ie/en/latest/api/client/hoodie.account.html#events) events and locks itself. You don't need to add any setup for it.

The [`cryptoStore.lock()`](#cryptostorelock) method is there, so that you can add a lock after a timeout functionality or lock the store in a save way when closing an tab.

```javascript
window.addEventListener('beforeunload', function (event) {
  // do your cleanup
  hoodie.cryptoStore.lock() // lock the cryptoStore in an cryptographic saver way.
                            // It overwrites the key data 10 times.
})
```

#### Open your app while signed in

This plugin doesn't save your users password! That results in you having to unlock the cryptoStore
on every instance/tap of your web-app!

Example:
```javascript
async function unlock (cryptoPassword) {
  await hoodie.cryptoStore.unlock(cryptoPassword) // then unlock

  // now do what you do after unlocking
}
```

#### Changing the password

You can change the password and salt used for encryption with [`cryptoStore.changePassword(oldPassword, newPassword)`](#cryptostorechangepasswordoldpassword-newpassword).
This method also updates all documents, that are encrypted with the old password!

It is recommended to sync before the password change! To update all documents.

Example:
```javascript
async function changePassword (oldPassword, newPassword) {
  await hoodie.connectionStatus.check() // check if your app is online

  if (hoodie.connectionStatus.ok) { // if your app is online: sync your users store
    await hoodie.store.sync()
  }

  const result = await hoodie.cryptoStore.changePassword(oldPassword, newPassword)

  console.log(result.notUpdated) // array of ids of all docs that weren't updated
}
```

## v2 Update Notes

### setPassword

`setPassword` was split into `setup` and `unlock`.

### Fail if not unlocked

All reading and writing methods fail now if this plugin wasn't unlocked!

### Checking the Password

__*v1 didn't check if the entered password was correct!* This version does now!__
It uses an encrypted random string in the `hoodiePluginCryptoStore/salt` doc. Saved in the `check`-field. With the same encryption as the other docs. It will be added/updated with `setup` and `changePassword`.

```JSON
{
  "_id": "hoodiePluginCryptoStore/salt",
  "salt": "bf11fa9bafca73586e103d60898989d4",
  "check": {
    "nonce": "6e9cf8a4a6eee26f19ff8c70",
    "tag": "0d2cfd645fe49b8a29ce22dbbac26b1e",
    "data": "5481cf42b7e3f1d15477ed8f1d938bd9fd6103903be6dd4e146f69d9f124e34f33b7f ... this is 256 chars long ..."
  }
}
```

__It will still unlock, if no password check is present on the salt-doc!__ But it will add a check as soon as the first encrypted doc is successfully read!

This is to ensure backwards compatibility.

__The password check autofix can be deactivated__

To deactivate the password check autofix add the option `noPasswordCheckAutoFix`.


```json
{
  "name": "your-hoodie-app",
  ...
  "hoodie": {
    "plugins": [
      "hoodie-plugin-store-crypto"
    ],
    "app": {
      "hoodie-plugin-store-crypto": {
        "noPasswordCheckAutoFix": true
      }
    }
  }
}
```

```javascript
// Or if you set up your client yourself

var Hoodie = require('@hoodie/client')
var PouchDB = require('pouchdb')
var cryptoStore = require('hoodie-plugin-store-crypto')

var hoodie = new Hoodie({ // create an instance of the hoodie-client
  url: '',
  PouchDB: PouchDB
})

cryptoStore(hoodie, { noPasswordCheckAutoFix: true }) // sets up hoodie.cryptoStore
```

Then a password check will only be added on the next password change.

## About the cryptography

This plugin uses the `sha256` and `pbkdf2` algorithm for generating a key from your password. The key is a 32 char Hash. And for encryption and decryption of your docs the `AES-GCM` algorithm is used.

### What is encrypted

Hoodie, CouchDB and PouchDB need `_id`, `_rev`, `_deleted`, `_attachments` and `_conflicts` to function. They and the content of the `hoodie` object, are **not encrypted**!
Everything else is run through `JSON.stringify` and encrypted.

This includes all fields of old documents. Thouse fields will then be deleted!

**_Please be aware, that the `_id` of a doc is not encrypted! Don't store important or personal information in the `_id`!_**

### Derive key from password and salt

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

### Encrypt a document

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

### Decrypt a document

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

## API

- [cryptoStore (setup function)](#cryptostore-setup-function)
- [cryptoStore.setup(password)](#cryptostoresetuppassword)
- [cryptoStore.setup(password, salt)](#cryptostoresetuppassword-salt)
- [cryptoStore.unlock(password)](#cryptostorelock)
- [cryptoStore.changePassword(oldPassword, newPassword)](#cryptostorechangepasswordoldpassword-newpassword)
- [cryptoStore.lock()](#cryptostorelock)
- [cryptoStore.add(properties)](#cryptostoreaddproperties)
- [cryptoStore.add(arrayOfProperties)](#cryptostoreaddarrayofproperties)
- [cryptoStore.find(id)](#cryptostorefindid)
- [cryptoStore.find(doc)](#cryptostorefinddoc)
- [cryptoStore.find(idsOrDocs)](#cryptostorefindidsordocs)
- [cryptoStore.findOrAdd(id, doc)](#cryptostorefindoraddid-doc)
- [cryptoStore.findOrAdd(doc)](#cryptostorefindoradddoc)
- [cryptoStore.findOrAdd(idsOrDocs)](#cryptostorefindoraddidsordocs)
- [cryptoStore.findAll()](#cryptostorefindall)
- [cryptoStore.update(id, changedProperties)](#cryptostoreupdateid-changedproperties)
- [cryptoStore.update(id, updateFunction)](#cryptostoreupdateid-updatefunction)
- [cryptoStore.update(doc)](#cryptostoreupdatedoc)
- [cryptoStore.update(arrayOfDocs)](#cryptostoreupdatearrayofdocs)
- [cryptoStore.updateOrAdd(id, doc)](#cryptostoreupdateoraddid-doc)
- [cryptoStore.updateOrAdd(doc)](#cryptostoreupdateoradddoc)
- [cryptoStore.updateOrAdd(arrayOfDocs)](#cryptostoreupdateoraddarrayofdocs)
- [cryptoStore.updateAll(changedProperties)](#cryptostoreupdateallchangedproperties)
- [cryptoStore.updateAll(updateFunction)](#cryptostoreupdateallupdatefunction)
- [cryptoStore.remove(id)](#cryptostoreremoveid)
- [cryptoStore.remove(doc)](#cryptostoreremovedoc)
- [cryptoStore.remove(idsOrDocs)](#cryptostoreremoveidsordocs)
- [cryptoStore.removeAll()](#cryptostoreremoveall)
- [cryptoStore.on()](#cryptostoreon)
- [cryptoStore.one()](#cryptostoreone)
- [cryptoStore.off()](#cryptostoreoff)
- [cryptoStore.withIdPrefix](#cryptostorewithidprefix)
- [cryptoStore.withPassword](#cryptostorewithpassword)
- [Events](#events)

### cryptoStore (setup function)

```javascript
cryptoStore(hoodie, options)
```

Argument | Type   | Description | Required
---------|--------|-------------|----------
`hoodie` | Object | Hoodie client instance | Yes
`options.noPasswordCheckAutoFix` | Boolean | [Deactivate password-check autofix](#v2-update-notes). Default is `False` | No

Returns `undefined`

__Only required if you setup your hoodie-client youself!__

Example
```javascript
var Hoodie = require('@hoodie/client')
var PouchDB = require('pouchdb')
var cryptoStore = require('hoodie-plugin-store-crypto')

var hoodie = new Hoodie({ // create an instance of the hoodie-client
  url: '',
  PouchDB: PouchDB
})

cryptoStore(hoodie) // sets up hoodie.cryptoStore

hoodie.cryptoStore.setup('test')
  .then(function () {
    console.log('done')
  })
```

### cryptoStore.setup(password)

```javascript
cryptoStore.setup(password)
```

Argument | Type   | Description                           | Required
---------|--------|---------------------------------------|----------
`password` | String | A password for encrypting the objects | Yes

Sets up the encryption and generates a salt and saves it in `hoodiePluginCryptoStore/salt`.
A salt is a string that will be used with the password together for the encryption.

__*This will not unlock the cryptoStore!*__

Rejects if there is already a local or remote `hoodiePluginCryptoStore/salt` or `_design/cryptoStore/salt` doc!

Rejects with:

Name 	| Status | Description
------|--------|--------
badarg | 500 | password must be a string!
badarg | 500 | password is to short!
unauthorized | 401 | Name or password is incorrect.

Example
```javascript
async function signUp (username, password, cryptoPassword) {
  const accountProperties = await hoodie.account.signUp({
    username: username,
    password: password
  })

  if (cryptoPassword == null) { // Use a separate password for encryption or the same
    cryptoPassword = password
  }
  await hoodie.cryptoStore.setup(cryptoPassword)

  return signIn(username, password, cryptoPassword) // Call your signIn function
}
```

### cryptoStore.setup(password, salt)

```javascript
cryptoStore.setup(password, salt)
```

Argument | Type   | Description                           | Required
---------|--------|---------------------------------------|----------
`password` | String | A password for encrypting the objects | Yes
`salt`   | String | To add another protection lair, as a second password. If this is missing, a salt will be generated. Which will result in a different encryption! | Yes

Sets up the encryption and saves the salt in `hoodiePluginCryptoStore/salt`.
A salt is a string that will be used with the password together for the encryption.

__*This will not unlock the cryptoStore!*__

Rejects if there is already a local or remote `hoodiePluginCryptoStore/salt` or `_design/cryptoStore/salt` doc!

Rejects with:

Name 	| Status | Description
------|--------|--------
badarg | 500 | password must be a string!
badarg | 500 | password is to short!
badarg | 500 | salt must be a 32 char string!
unauthorized | 401 | Name or password is incorrect.

Example
```javascript
async function signUp (username, password, cryptoPassword, salt) {
  const accountProperties = await hoodie.account.signUp({
    username: username,
    password: password
  })

  if (cryptoPassword == null) { // Use a separate password for encryption or the same
    cryptoPassword = password
  }
  await hoodie.cryptoStore.setup(cryptoPassword, salt)

  return signIn(username, password, cryptoPassword) // Call your signIn function
}
```

### cryptoStore.unlock(password)

```javascript
cryptoStore.unlock(password)
```

Argument | Type   | Description                           | Required
---------|--------|---------------------------------------|----------
`password` | String | The password used for encrypting the objects | Yes

Uses the salt in `hoodiePluginCryptoStore/salt` or `_design/cryptoStore/salt` and unlocks the cryptoStore.
It will pull `hoodiePluginCryptoStore/salt` and `_design/cryptoStore/salt` from the remote and
reject if they don't exists or are deleted or the password mismatch.

Rejects with:

Name 	| Status | Description
------|--------|--------
badarg | 500 | password must be a string!
badarg | 500 | password is to short!
badarg | 500 | salt in "hoodiePluginCryptoStore/salt" must be a 32 char string!
invalid_request | 400 | store is already unlocked!
unauthorized | 401 | Name or password is incorrect.
not_found | 404 | missing

Example
```javascript
async function signIn (username, password, cryptoPassword) {
  const accountProperties = await hoodie.account.signIn({
    username: username,
    password: password
  })

  await hoodie.cryptoStore.unlock(cryptoPassword)

  // now do what you do after sign in.
}
```

### cryptoStore.changePassword(oldPassword, newPassword)

```javascript
cryptoStore.changePassword(oldPassword, newPassword)
```

Argument      | Type   | Description    | Required
--------------|--------|----------------|---------
`oldPassword` | String | The old password, that was used up until now | Yes
`newPassword` | String | New password, with which the docs will be encrypted | Yes

Resolves with an object with the new `salt` and an array (`notUpdated`) with the ids of not updated docs.
It will update all with `oldPassword` encrypted documents. And encrypt them with with the help of
the `newPassword`. It also updates the `salt` in `hoodiePluginCryptoStore/salt`.

Rejects with:

Name 	| Status | Description
------|--------|--------
badarg | 500 | New password must be a string!
unauthorized | 401 | Name or password is incorrect.

Example
```javascript
hoodie.cryptoStore.changePassword('my-old-password', 'secret').then(function (report) {
  console.log('all documents are updated!')
  console.log(report.salt) // the new salt
  console.log(report.notUpdated) // array with all ids of encrypted docs that have not been updated
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.lock()

```javascript
cryptoStore.lock()
```

This locks the store and every method fails until a new password is set. It also overwrites the internal key's memory in a in an cryptographic save way (10 times).

Resolves with a Boolean. `true` if the store is now locked, `false` if the store was already locked.

The `cryptoStore` listen automatically to [`hoodie.account.on('signout')`](http://docs.hood.ie/en/latest/api/client/hoodie.account.html#events) events and locks itself.

### cryptoStore.add(properties)

```javascript
cryptoStore.add(properties)
```

Argument      | Type   | Description                                     | Required
--------------|--------|-------------------------------------------------|----------
`properties`  | Object | properties of document                          | Yes
`properties._id` | String | If set, the document will be stored at given id | No

Resolves with `properties` unencrypted and adds `id` (unless provided). And adds a `hoodie` property with `createdAt` and `updatedAt` properties. It will be encrypted.

```JSON
{
  "_id": "12345678-1234-1234-1234-123456789ABC",
  "foo": "bar",
  "hoodie": {
    "createdAt": "2018-05-26T18:38:32.920Z",
    "updatedAt": "2018-05-26T18:38:32.920Z"
  }
}
```

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object
Conflict | 409 | Object with id "id" already exists

Example
```javascript
hoodie.cryptoStore.add({foo: 'bar'}).then(function (doc) {
  console.log(doc.foo) // bar
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.add(arrayOfProperties)

```javascript
cryptoStore.add([properties])
```

Argument          | Type  | Description      | Required
------------------|-------|--------------------------|----------
`arrayOfProperties` | Array | Array of `properties`, see `cryptoStore.add(properties)`  | Yes

Resolves with an array of `properties` unencrypted in the `arrayOfProperties` and adds `_id` (unless provided). And adds a `hoodie` property with `createdAt` and `updatedAt` properties. It will be encrypted.

```JSON
[
  {
    "_id": "12345678-1234-1234-1234-123456789ABC",
    "foo": "bar",
    "hoodie": {
      "createdAt": "2018-05-26T18:38:32.920Z",
      "updatedAt": "2018-05-26T18:38:32.920Z"
    }
  }
]
```

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object
Conflict | 409 | Object with id "id" already exists

Example
```javascript
hoodie.cryptoStore.add([{foo: 'bar'}, {bar: 'baz'}]).then(function (docs) {
  console.log(docs.length) // 2
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.find(id)

```javascript
cryptoStore.find(id)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes

Resolves with `properties` unencrypted. Works on encrypted and unencrypted documents.

```JSON
{
  "_id": "12345678-1234-1234-1234-123456789ABC",
  "foo": "bar",
  "hoodie": {
    "createdAt": "2018-05-26T18:38:32.920Z",
    "updatedAt": "2018-05-26T18:38:32.920Z"
  }
}
```

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
Not found | 404 | Object with id "id" is missing

Example

```javascript
hoodie.cryptoStore.find('12345678-1234-1234-1234-123456789ABC').then(function (doc) {
  console.log(doc)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.find(doc)

```javascript
cryptoStore.find(doc)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`doc`   | Object | Document with `_id` property  | Yes

Resolves with `properties` unencrypted. Works on encrypted and unencrypted documents.

```JSON
{
  "_id": "12345678-1234-1234-1234-123456789ABC",
  "foo": "bar",
  "hoodie": {
    "createdAt": "2018-05-26T18:38:32.920Z",
    "updatedAt": "2018-05-26T18:38:32.920Z"
  }
}
```

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
Not found | 404 | Object with id "id" is missing

Example

```javascript
hoodie.cryptoStore.find(doc).then(function (doc) {
  console.log(doc)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.find(idsOrDocs)

```javascript
cryptoStore.find([doc])
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`idsOrDocs` | Array | Array of `id` (String) or `doc` (Object) items  | Yes

Resolves with array of `properties` unencrypted. Works on encrypted and unencrypted documents.

```JSON
[
  {
    "_id": "12345678-1234-1234-1234-123456789ABC",
    "foo": "bar",
    "hoodie": {
      "createdAt": "2018-05-26T18:38:32.920Z",
      "updatedAt": "2018-05-26T18:38:32.920Z"
    }
  }
]
```

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
Not found | 404 | Object with id "id" is missing

Example

```javascript
hoodie.cryptoStore.find([
  doc,
  "12345678-1234-1234-1234-123456789ABC"
]).then(function (docs) {
  console.log(docs.length) // 2
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.findOrAdd(id, doc)

```javascript
cryptoStore.findOrAdd(id, doc)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes
`doc`   | Object | Document that will be saved if no document with the id exists | Yes

Resolves with `properties` unencrypted. Works on encrypted and unencrypted documents. If doc is added, it will be encrypted and a `hoodie` property with `createdAt` and `updatedAt` properties added.

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
missing_id | 412 | \_id is required for puts

Example

```javascript
hoodie.cryptoStore.findOrAdd('12345678-1234-1234-1234-123456789ABC', doc).then(function (doc) {
  console.log(doc)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.findOrAdd(doc)

```javascript
cryptoStore.findOrAdd(doc)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`doc`   | Object | Document  with `_id` property | Yes

Resolves with `properties` unencrypted. Works on encrypted and unencrypted documents. If doc is added, it will be encrypted and a `hoodie` property with `createdAt` and `updatedAt` properties added.

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
missing_id | 412 | \_id is required for puts

Example

```javascript
hoodie.cryptoStore.findOrAdd(doc).then(function (doc) {
  console.log(doc)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.findOrAdd(idsOrDocs)

```javascript
cryptoStore.findOrAdd(idsOrDocs)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`idsOrDocs` | Array | Array of documents with `_id` property or ids | Yes

Resolves with array of `properties` unencrypted. Works on encrypted and unencrypted documents. If a doc is added, it will be encrypted and a `hoodie` property with `createdAt` and `updatedAt` properties added.

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
missing_id | 412 | \_id is required for puts

Example

```javascript
hoodie.cryptoStore.findOrAdd([
  doc,
  '12345678-1234-1234-1234-123456789ABC'
]).then(function (docs) {
  console.log(docs.length) // 2
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.findAll()

```javascript
cryptoStore.findAll(filterFunction)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`filterFunction` | Function | Function that will be called for every doc with `doc`, `index` and `arrayOfAllDocs`. And returns `true` if `doc` should be returned, `false` if not. | No

Resolves with array of `properties` unencrypted. Works on encrypted and unencrypted documents.

```JSON
[
  {
    "_id": "12345678-1234-1234-1234-123456789ABC",
    "foo": "bar",
    "hoodie": {
      "createdAt": "2018-05-26T18:38:32.920Z",
      "updatedAt": "2018-05-26T18:38:32.920Z"
    }
  }
]
```

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.

Example

```javascript
function filter (doc, index, allDocs) {
  return index % 2 === 0
}

hoodie.cryptoStore.findAll(filter).then(function (docs) {
  console.log(docs.length)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.update(id, changedProperties)

```javascript
cryptoStore.update(id, changedProperties)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes
`changedProperties` | Object | Properties that should be changed | Yes

Resolves with updated `properties` unencrypted. Works on encrypted and unencrypted documents. If the document was unencrypted it will be encrypted.

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object
not_found | 404 | missing
\- | \- | Must provide change

Example

```javascript
hoodie.cryptoStore.update('12345678-1234-1234-1234-123456789ABC', {foo: 'bar'}).then(function (doc) {
  console.log(doc)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.update(id, updateFunction)

```javascript
cryptoStore.update(id, updateFunction)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes
`updateFunction` | Function | Function that get the document passed and changes the document. | Yes

Resolves with updated `properties` unencrypted. Works on encrypted and unencrypted documents. If the document was unencrypted it will be encrypted.

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object
not_found | 404 | missing
\- | \- | Must provide change

Example

```javascript
function updater (doc) {
  doc.foo = 'bar'
}

hoodie.cryptoStore.update('12345678-1234-1234-1234-123456789ABC', updater).then(function (doc) {
  console.log(doc.foo) // bar
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.update(doc)

```javascript
cryptoStore.update(doc)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`doc`   | Object | Properties that should be changed with a `_id` property | Yes

Resolves with updated `properties` unencrypted. Works on encrypted and unencrypted documents. If the document was unencrypted it will be encrypted.

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object
not_found | 404 | missing

Example

```javascript
hoodie.cryptoStore.update({
  _id: '12345678-1234-1234-1234-123456789ABC',
  foo: 'bar'
}).then(function (doc) {
  console.log(doc)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.update(arrayOfDocs)

```javascript
cryptoStore.update(arrayOfDocs)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`arrayOfDocs` | Array | Array properties that should be changed with a `_id` property | Yes

Resolves with an array of updated `properties` unencrypted. Works on encrypted and unencrypted documents. If the document was unencrypted it will be encrypted.

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object
not_found | 404 | missing

Example

```javascript
hoodie.cryptoStore.update([
  {
    _id: '12345678-1234-1234-1234-123456789ABC',
    foo: 'bar'
  },
  otherDoc
]).then(function (docs) {
  console.log(docs.length) // 2
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.updateOrAdd(id, doc)

```javascript
cryptoStore.updateOrAdd(id, doc)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes
`doc`   | Object | Properties that should be changed or added if doc doesn't exist | Yes

Resolves with updated `properties` unencrypted. Updates existing documents and adds nonexistent docs. Works on encrypted and unencrypted documents. If the document was unencrypted it will be encrypted. If the doc is added, it will be encrypted and a `hoodie` property with `createdAt` and `updatedAt` properties added.

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object

Example

```javascript
hoodie.cryptoStore.updateOrAdd('12345678-1234-1234-1234-123456789ABC', {foo: 'bar'}).then(function (doc) {
  console.log(doc)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.updateOrAdd(doc)

```javascript
cryptoStore.updateOrAdd(doc)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`doc`   | Object | Properties that should be changed or added with a `_id` property | Yes

Resolves with updated `properties` unencrypted. Updates existing documents and adds nonexistent docs. Works on encrypted and unencrypted documents. If the document was unencrypted it will be encrypted. If the doc is added, it will be encrypted and a `hoodie` property with `createdAt` and `updatedAt` properties added.

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object

Example

```javascript
hoodie.cryptoStore.updateOrAdd({
  _id: '12345678-1234-1234-1234-123456789ABC',
  foo: 'bar'
}).then(function (doc) {
  console.log(doc)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.updateOrAdd(arrayOfDocs)

```javascript
cryptoStore.updateOrAdd(arrayOfDocs)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`arrayOfDocs` | Array | Array properties that should be changed or added with a `_id` property | Yes

Resolves with an array of updated `properties` unencrypted. Updates existing documents and adds nonexistent docs. Works on encrypted and unencrypted documents. If the document was unencrypted it will be encrypted. If the doc is added, it will be encrypted and a `hoodie` property with `createdAt` and `updatedAt` properties added.

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object

Example

```javascript
hoodie.cryptoStore.updateOrAdd([
  {
    _id: '12345678-1234-1234-1234-123456789ABC',
    foo: 'bar'
  },
  otherDoc
]).then(function (docs) {
  console.log(docs.length) // 2
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.updateAll(changedProperties)

```javascript
cryptoStore.updateAll(changedProperties)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`changedProperties` | Object | Properties that should be changed by all documents | Yes

Resolves with updated `properties` unencrypted. Works on encrypted and unencrypted documents. If the document was unencrypted it will be encrypted.

__This updates and encrypts all documents with its idPrefix!__

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
\- | \- | Must provide object or function

Example

```javascript
// This updates and encrypts all documents in the users store!
hoodie.cryptoStore.updateAll({foo: 'bar'}).then(function (docs) {
  console.log(docs) // all docs!
}).catch(function (error) {
  console.error(error)
})

// This updates and encrypts all documents that have an _id that starts with 'foo/'!
hoodie.cryptoStore.withIdPrefix('foo/').updateAll({foo: 'bar'}).then(function (docs) {
  console.log(docs) // all docs whose _id starts with 'foo/'!
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.updateAll(updateFunction)

```javascript
cryptoStore.updateAll(updateFunction)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`updateFunction` | Function | Function that get the document passed and changes the document. | Yes

Resolves with updated `properties` unencrypted. Works on encrypted and unencrypted documents. If the document was unencrypted it will be encrypted.

__This updates and encrypts all documents with its idPrefix!__

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
\- | \- | Must provide object or function

Example

```javascript
// This updates and encrypts all documents in the users store!
hoodie.cryptoStore.updateAll(function (doc) {
  doc.foo = 'bar'
}).then(function (docs) {
  console.log(docs) // all docs!
}).catch(function (error) {
  console.error(error)
})

// This updates and encrypts all documents that have an _id that starts with 'foo/'!
hoodie.cryptoStore.withIdPrefix('foo/').updateAll(function (doc) {
  doc.foo = 'bar'
}).then(function (docs) {
  console.log(docs) // all docs whose _id starts with 'foo/'!
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.remove(id)

```javascript
cryptoStore.remove(id)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes

Resolves with `properties` unencrypted. Works on encrypted and unencrypted documents. It set the document to deleted. If the document was unencrypted it will be encrypted. It adds `deletedAt` to the `hoodie` property.

```JSON
{
  "_id": "12345678-1234-1234-1234-123456789ABC",
  "_deleted": true,
  "foo": "bar",
  "hoodie": {
    "createdAt": "2018-05-26T18:38:32.920Z",
    "updatedAt": "2018-05-30T00:05:46.976Z",
    "deletedAt": "2018-05-30T00:05:46.976Z"
  }
}
```

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object
not_found | 404 | missing

Example

```javascript
hoodie.cryptoStore.remove('12345678-1234-1234-1234-123456789ABC').then(function (doc) {
  console.log(doc)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.remove(doc)

```javascript
cryptoStore.remove(doc)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`doc`   | Object | Properties that should be changed with a `_id` property | Yes

Resolves with `properties` unencrypted. Works on encrypted and unencrypted documents. It set the document to deleted and updates `properties`. If the document was unencrypted it will be encrypted. It adds `deletedAt` to the `hoodie` property.

```JSON
{
  "_id": "12345678-1234-1234-1234-123456789ABC",
  "_deleted": true,
  "foo": "bar",
  "hoodie": {
    "createdAt": "2018-05-26T18:38:32.920Z",
    "updatedAt": "2018-05-30T00:05:46.976Z",
    "deletedAt": "2018-05-30T00:05:46.976Z"
  }
}
```

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object
not_found | 404 | missing

Example

```javascript
hoodie.cryptoStore.remove({
  _id: '12345678-1234-1234-1234-123456789ABC',
  foo: 'bar'
}).then(function (doc) {
  console.log(doc.foo) // bar
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.remove(idsOrDocs)

```javascript
cryptoStore.remove(idsOrDocs)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`idsOrDocs`  | Array | Properties that should be changed with a `_id` property or ids | Yes

Resolves with `properties` unencrypted. Works on encrypted and unencrypted documents. It set the document to deleted and updates `properties`. If the document was unencrypted it will be encrypted. It adds `deletedAt` to the `hoodie` property.

```JSON
[
  {
    "_id": "12345678-1234-1234-1234-123456789ABC",
    "_deleted": true,
    "foo": "bar",
    "hoodie": {
      "createdAt": "2018-05-26T18:38:32.920Z",
      "updatedAt": "2018-05-30T00:05:46.976Z",
      "deletedAt": "2018-05-30T00:05:46.976Z"
    }
  }
]
```

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.
bad_request | 400 | Document must be a JSON object
not_found | 404 | missing

Example

```javascript
hoodie.cryptoStore.remove([
  doc,
  '12345678-1234-1234-1234-123456789ABC'
]).then(function (docs) {
  console.log(docs.length) // 2
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.removeAll()

```javascript
cryptoStore.removeAll(updateFunction)
```

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`filterFunction` | Function | Function that will be called for every doc with `doc`, `index` and `arrayOfAllDocs`. And returns `true` if `doc` should be returned, `false` if not. | No

Resolves with updated `properties` unencrypted. Works on encrypted and unencrypted documents. If the document was unencrypted it will be encrypted.

```JSON
[
  {
    "_id": "12345678-1234-1234-1234-123456789ABC",
    "_deleted": true,
    "foo": "bar",
    "hoodie": {
      "createdAt": "2018-05-26T18:38:32.920Z",
      "updatedAt": "2018-05-30T00:05:46.976Z",
      "deletedAt": "2018-05-30T00:05:46.976Z"
    }
  }
]
```

Rejects with:

Name 	| Status | Description
------|--------|--------
unauthorized | 401 | Name or password is incorrect.

Example

```javascript
function filter (doc, index, allDocs) {
  return index % 2 === 0
}

hoodie.cryptoStore.removeAll(filter).then(function (docs) {
  console.log(docs.length)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.on()

```javascript
cryptoStore.on(eventName, handler)
```

Argument| Type  | Description      | Required
--------|-------|------------------|----------
`eventName` | String | Event type. One of `add`, `update`, `remove` or `change`. | Yes
`handler` | Function | Event Handler, that will be called every time that event emits. | Yes

Returns the `cryptoStore`. `hander` will be called with an updated doc. If the event is `change`, than the first argument is a `eventName`.

Rejects with:

Name 	| Description
------|--------
Error |	...

Example

```javascript
function changeHandler (eventName, doc) {
  console.log(eventName, doc)
}

hoodie.cryptoStore.on('change', changeHandler)
  .on('add', function (doc) { // .on returns the cryptoStore
    console.log('a doc with ' + doc._id + 'was added')
  })
```

### cryptoStore.one()

```javascript
cryptoStore.one(eventName, handler)
```

Argument| Type  | Description      | Required
--------|-------|------------------|----------
`eventName` | String | Event type. One of `add`, `update`, `remove` or `change`. | Yes
`handler` | Function | Event Handler, that will be called one time that event emits. | Yes

Returns the `cryptoStore`. `hander` will be called with an updated doc. If the event is `change`, than the first argument is a `eventName`. After that event is emitted, that handler will be removed.

Rejects with:

Name 	| Description
------|--------
Error |	...

Example

```javascript
function changeHandler (eventName, doc) {
  console.log(eventName, doc)
}

hoodie.cryptoStore.one('change', changeHandler)
  .one('add', function (doc) { // .on returns the cryptoStore
    console.log('a doc with ' + doc._id + 'was added')
  })
```

### cryptoStore.off()

```javascript
cryptoStore.off(eventName, handler)
```

Argument| Type  | Description      | Required
--------|-------|------------------|----------
`eventName` | String | Event type. One of `add`, `update`, `remove` or `change`. | Yes
`handler` | Function | Event Handler, that will be removed | Yes

Returns the `cryptoStore`.

Rejects with:

Name 	| Description
------|--------
Error |	...

Example

```javascript
var changeHandler = function (eventName, doc) {
  console.log(eventName, doc)
}

hoodie.cryptoStore.on('change', changeHandler)

hoodie.cryptoStore.off('change', changeHandler)
```

### cryptoStore.withIdPrefix

```javascript
cryptoStore.withIdPrefix(prefix)
```

Argument| Type  | Description      | Required
--------|-------|------------------|----------
`prefix` | String | Section that will be added before every `id`. | Yes

Returns the prefixed copy of the `cryptoStore`.

Rejects with:

Name 	| Description
------|--------
Error |	...

Example

```javascript
var userData = hoodie.cryptoStore.withIdPrefix('user/')

// Only emits changes for docs with a 'user/'-prefix.
userData.on('change', function (eventName, doc) {
  console.log(eventName, doc)
})

userData.add({
  _id: 'test-user', // will be saved as 'user/test-user'
  name: 'Tester'
})
  .then(function (doc) {
    console.log(doc._id) // 'user/test-user'
    return userData.find('test-user')
  })

  .then(function (doc) {
    doc.isTester = true
    userData.update(doc) // 'user/test-user' and 'test-user' work!
  })
```

### cryptoStore.withPassword

```javascript
cryptoStore.withPassword(password, salt)
```

Argument| Type  | Description      | Required
--------|-------|------------------|----------
`password` | String | A password for encrypting the objects | Yes
`salt`   | String | A second password part, to add another protection lair. If this is missing a salt will be generated. Which will result in a different encryption! | No

Resolves with an `object` containing the used `salt` and a prefixed copy of the `cryptoStore`.

```JSON
{
  "salt": "1234567890",
  "store": {
    "add": function () {},
    "withPassword": function () {},
    ...
  }
}
```

Rejects with:

Name 	| Description
------|--------
Error |	...

Example

```javascript
var result = hoodie.cryptoStore.withPassword('secretPassword')

  .then(function (result) {
    var store = result.store
    var salt = result.salt

    // Only emits changes for docs that are encrypted with this password and salt.
    store.on('change', function (eventName, doc) {
      console.log(eventName, doc)
    })

    store.add({foo: 'bar'})

    // you must save the salt! Only with the same salt it is the same encryption!
    hoodie.cryptoStore.findOrAdd({
      _id: 'secondPasswordSalt',
      salt: salt
    })
  })
```

### Events

Event |	Description |	Arguments
------|-------------|---------
`add` | Is emitted every time a doc is added/created. | `doc` the added document.
`update` | Is emitted every time a doc is updated/changed. | `doc` the changed document
`remove` | Is emitted every time a doc is removed. | `doc` the removed document.
`change` | Is emitted every time a doc is added, updated or removed. | `event` what did happen? (`add`, `update` or `remove`), `doc` the changed document.
