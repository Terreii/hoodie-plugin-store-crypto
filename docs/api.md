| [index](../README.md) | API | [about cryptography](./about_cryptography.md) | [update](./update.md) | [Contributing](../CONTRIBUTING.md) | [Code of Conduct](../CODE_OF_CONDUCT.md) |
|-----------------------|-----|-----------------------------------------------|-----------------------|-----------------------------------|------------------------------------------|

# API

## Table of Contents

- [General concepts](#general-concepts)
  - [What gets encrypted](#what-gets-encrypted)
    - [Select fields that shouldn't get encrypted](#select-fields-that-shouldnt-get-encrypted)
  - [Handling of un-encrypted documents](#handling-of-un-encrypted-documents)
  - [Documents from this plugin](#documents-from-this-plugin)
  - [Concepts of cryptoStore.withPassword](#concepts-of-cryptostorewithpassword)
- [Methods](#methods)
  - [Constructor](#constructor)
  - [cryptoStore.setup(password)](#cryptostoresetuppassword)
  - [cryptoStore.setup(password, salt)](#cryptostoresetuppassword-salt)
  - [cryptoStore.unlock(password)](#cryptostorelock)
  - [cryptoStore.changePassword(oldPassword, newPassword)](#cryptostorechangepasswordoldpassword-newpassword)
  - [cryptoStore.resetPassword(resetKey, newPassword)](#cryptostoreresetpasswordresetkey-newpassword)
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
  - [cryptoStore.isEncrypted(object)](#cryptostoreisencryptedobject)
  - [cryptoStore.isEncrypted(Promise)](#cryptostoreisencryptedpromise)
  - [cryptoStore.encrypt(jsonValue, aad)](#cryptostoreencryptjsonvalue-aad)
  - [cryptoStore.decrypt(encrypted, aad)](#cryptostoredecryptencrypted-aad)
  - [cryptoStore.on()](#cryptostoreon)
  - [cryptoStore.one()](#cryptostoreone)
  - [cryptoStore.off()](#cryptostoreoff)
  - [cryptoStore.withIdPrefix](#cryptostorewithidprefix)
  - [cryptoStore.withPassword](#cryptostorewithpassword)
  - [Events](#events)

## General concepts

Those concepts/rules apply to all methods.

### What gets encrypted

**Everything of a doc will get encrypted. Except for `_id`, `_rev`, `_deleted`, `_attachments`, `_conflicts` and the `hoodie` object!**

Also _all keys that start with an underscore (\_) will not get encrypted_! Because they are __special document members__ used by CouchDB and PouchDB!

**Don't save private data in the `_id`**!

#### Design-Documents

You can read and write [design-documents (ddoc)](https://docs.couchdb.org/en/stable/ddocs/index.html "CouchDB's design docs documentation") using this plugin (if the active user has the rights for this).

All the [special fields](https://docs.couchdb.org/en/stable/api/ddoc/common.html#put--db-_design-ddoc "List of all special ddoc fields") of an design document will not get encrypted!

#### Select fields that shouldn't get encrypted

You can also define your own fields that shouldn't get encrypted. This works on all methods.

There are two ways for it:
- add an array of field-names as `cy_ignore`
- add an array of field-names as `__cy_ignore` (please note the 2 `_` at the beginning!)

Both work the same way: Every field listed in one of them, won't get encrypted. They differentiate in that `cy_ignore` will get saved (encrypted) in the document. While `__cy_ignore` is temporary, and won't get saved.

```javascript
hoodie.cryptoStore.add({
  secretValue: 'this will get encrypted',
  publicValue: 'this will not get encrypted', // will get saved in plain text
  cy_ignore: ['publicValue'], // list all fields that shouldn't get encrypted
  __cy_ignore: [ // both can be used at the same time!
    'other' // Not existing fields are not an error!
  ]
})
```

Results in:
```JSON
{
  "_id": "12345678-1234-1234-1234-123456789ABC",
  "_rev": "1-1234567890",
  "hoodie": { "createdAt": "2018-05-26T18:38:32.920Z" },
  "tag": "6bc503f508a8...",
  "data": "1b16dfd59038808511...",
  "nonce": "433d5b039fb...",
  "publicValue": "this will not get encrypted"
}
```

##### Some tips:
- On reading a document all not encrypted fields will get merged in the final object. But on a conflict the encrypted fields will overwrite the un-encrypted ones!
- `cy_ignore` gets also encrypted. But if it gets listed in `cy_ignore` or `__cy_ignore`, then it will not get encrypted.

### Handling of un-encrypted documents

All methods can read un-encrypted documents.

Un-encrypted documents get fully encrypted, if they get updated using one of the methods! All data will then get encrypted and and the un-encrypted data will get deleted!

```JSON
{
  "_id": "something",
  "_rev": "1-e66d7e8ddf584d0fa56e34105b5b1752",
  "hoodie": {
    "createdAt": "An ISO-Date"
  },
  "foo": "bar"
}
```

After `hoodie.cryptoStore.update(await hoodie.store.find('something'))` becomes:

```JSON
{
  "_id": "something",
  "_rev": "2-b9c5a6b9353e4dfcaf5a9183da02a647",
  "hoodie": {
    "createdAt": "An ISO-Date",
    "updatedAt": "Another ISO-Date"
  },
  "data": "09ae27028776974ef291030b85",
  "nonce": "f04ad8243a5ab2f59cc4a174",
  "tag": "9b01f13a765ed9351d97a11bba48e7b4"
}
```

### Documents from this plugin

Settings, reset-keys, and the salt-document get saved using a prefix of `hoodiePluginCryptoStore/`.

Those are:

- **hoodiePluginCryptoStore/salt** - for storing the salt and password check
- **hoodiePluginCryptoStore/pwReset_[0-9]** - for storing the reset-keys. They are 10 documents.

### Concepts of cryptoStore.withPassword

You can use `cryptoStore.withPassword()` even if the cryptoStore isn't unlocked!

It allows to encrypt documents with a different password (and salt). It is like `cryptoStore.withIdPrefix()` but for passwords.

## Methods

### Constructor

```javascript
new CryptoStore(store, options)
```

Setup the __cryptoStore__ and adds it to hoodie.

Argument | Type   | Description | Required
---------|--------|-------------|----------
`store` | Object | Hoodie's client-store instance or hoodieApi instance from `pouchdb-hoodie-api` | Yes
`options.noPasswordCheckAutoFix` | Boolean | [Deactivate password-check autofix](#v2-update-notes). Default is `false` | No
`options.remote` | PouchDB | Remote database. Used to check and fetch the salt doc. | No

Returns `cryptoStore` API.

__Required if you setup your hoodie-client yourself! Else Hoodie does it for you!__

Example
```javascript
var Store = require('@hoodie/store-client')
var PouchDB = require('pouchdb')
var CryptoStore = require('hoodie-plugin-store-crypto')

var store = new Store('mydbname', {
  PouchDB: PouchDB,
  remote: 'http://localhost:5984/mydbname'
})

var cryptoStore = new CryptoStore(store, { /* some options */}) // sets up the cryptoStore

cryptoStore.setup('test')
  .then(function () {
    console.log('done')
  })
```

To lock the cryptoStore on sign out you have to listen to [hoodie's `signout` event](https://github.com/hoodiehq/hoodie-account-client#events).

```javascript
hoodie.account.on('signout', () => {
  cryptoStore.lock()
})
```

If you use Hoodie's plugin API, then locking on sign out is already setup for you.

### cryptoStore.setup(password)

```javascript
cryptoStore.setup(password)
```

Setup an users encryption.

Argument | Type   | Description                           | Required
---------|--------|---------------------------------------|----------
`password` | String | A password for encrypting the objects | Yes

Results with an Array of 10 `resetKeys` (Strings). `crytoStore.resetPassword()` requires them, in case the
user did forget their encryption-password.

Sets up the encryption, generates a salt and saves it in `hoodiePluginCryptoStore/salt`.
A salt is a string that will get used with the password together for the encryption. [More about what the salt is](http://www.passwordbreeder.com/page/salt).

__*This will not unlock the cryptoStore!*__

Rejects if there is already a local or remote `hoodiePluginCryptoStore/salt` doc!

Rejects with:

Name 	| Status | Description | Why
------|--------|-------------|----
badarg | 500 | password must be a string! | The password wasn't a string.
badarg | 500 | password is to short! | The password must be longer than 2 chars. (You should require an even longer password!)
unauthorized | 401 | Name or password is incorrect. | Did already setup.

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
  const resetKeys = await hoodie.cryptoStore.setup(cryptoPassword)

  // This can be: displaying the 10 keys to the user
  // or/and generate a text-file for the user to download.
  displayResetKeys(resetKeys)

  return signIn(username, password, cryptoPassword) // Call your signIn function
}
```

### cryptoStore.setup(password, salt)

```javascript
cryptoStore.setup(password, salt)
```

Setup an user for encryption. But provide your own salt. *This is not recommended!*

Argument | Type   | Description                           | Required
---------|--------|---------------------------------------|----------
`password` | String | A password for encrypting the objects | Yes
`salt`   | String | To add another protection lair, as a second password. If this is missing, a salt will be generated. Which will result in a different encryption! | Yes

Results with an Array of 10 `resetKeys` (Strings). `crytoStore.resetPassword()` requires them, in case the
user did forget their encryption-password.

Sets up the encryption and saves the salt in `hoodiePluginCryptoStore/salt`.
A salt is a string that will get used with the password together for the encryption.
[More about what the salt is](http://www.passwordbreeder.com/page/salt).

__*This will not unlock the cryptoStore!*__

Rejects if there is already a local or remote `hoodiePluginCryptoStore/salt` doc!

Rejects with:

Name 	| Status | Description | Why
------|--------|-------------|-----
badarg | 500 | password must be a string! | The password wasn't a string.
badarg | 500 | password is to short! | The password must be longer than 2 chars. (You should require an even longer password!)
badarg | 500 | salt must be a 32 char string! | The passed salt wasn't a string or not 32 chars long!
unauthorized | 401 | Name or password is incorrect. | Did already setup.

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
  const resetKeys = await hoodie.cryptoStore.setup(cryptoPassword, salt)

  // This can be: displaying the 10 keys to the user
  // or/and generate a text-file for the user to download.
  displayResetKeys(resetKeys)

  return signIn(username, password, cryptoPassword) // Call your signIn function
}
```

### cryptoStore.unlock(password)

```javascript
cryptoStore.unlock(password)
```

Unlock the cryptoStore. It will be ready for usage after it. The user must be `setup` first!

Argument | Type   | Description                           | Required
---------|--------|---------------------------------------|----------
`password` | String | The password used for encrypting the objects | Yes

Uses the salt in `hoodiePluginCryptoStore/salt` and unlocks the cryptoStore.
It will pull `hoodiePluginCryptoStore/salt` from the remote and
reject if it doesn't exists or got deleted or the password mismatch.

Rejects with:

Name 	| Status | Description | Why
------|--------|-------------|-----
badarg | 500 | password must be a string! | The password wasn't a string.
badarg | 500 | password is to short! | The password must be longer than 2 chars.
badarg | 500 | salt in "hoodiePluginCryptoStore/salt" must be a 32 char string! | The salt was changed and is not a 32 char string!
invalid_request | 400 | store is already unlocked! | Store is unlocked.
unauthorized | 401 | Name or password is incorrect. | The password wasn't correct. (user input)
not_found | 404 | missing | The salt-doc couldn't be found! Was it deleted or the user wasn't setup?

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

Changes the encryption password and salt. Then it will update all encrypted documents.

All encrypted documents, that couldn't get decrypted, will not get updated! The Array, at the `notUpdated` field, will include all their `_id`s.

Argument      | Type   | Description    | Required
--------------|--------|----------------|---------
`oldPassword` | String | The old password, that was used up until now | Yes
`newPassword` | String | New password, with which the docs will be encrypted | Yes

Resolves with an object with the new `salt`, an array (`notUpdated`) with the ids of not updated docs and
an Array of 10 new `resetKeys`.

It will update all with `oldPassword` encrypted documents. And encrypt them with with the help of
the `newPassword`. It also updates the `salt` in `hoodiePluginCryptoStore/salt`.

Rejects with:

Name 	| Status | Description | Why
------|--------|-------------|----
badarg | 500 | New password must be a string! | The new password wasn't a string.
badarg | 500 | password is to short! | The new password must be longer than 2 chars.
unauthorized | 401 | Name or password is incorrect. | The entered old password is wrong.

Example
```javascript
hoodie.cryptoStore.changePassword('my-old-password', 'secret').then(function (report) {
  console.log('all documents are updated!')
  console.log(report.salt) // the new salt
  console.log(report.notUpdated) // array with all ids of encrypted docs that have not been updated

  // This can be: displaying the 10 keys to the user
  // or/and generate a text-file for the user to download.
  displayResetKeys(report.resetKeys)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.resetPassword(resetKey, newPassword)

```javascript
cryptoStore.resetPassword(resetKey, newPassword)
```

This is for when the __user did forget their password__.

Changes the encryption password and salt. Then it will update all encrypted documents.

All encrypted documents, that couldn't get decrypted, will not get updated! The Array, at the `notUpdated` field, will include all their `_id`s.

Argument      | Type   | Description    | Required
--------------|--------|----------------|---------
`resetKey` | String | One of the `resetKeys` generated by `setup()`, `changePassword()` and `resetPassword()` | Yes
`newPassword` | String | New password, with which the docs will be encrypted | Yes

Resolves with an object with the new `salt`, an array (`notUpdated`) with the ids of not updated docs and
an Array of 10 new `resetKeys`.
It will update all with the main password encrypted documents. And encrypt them with with the help of
the `newPassword`. It also updates the `salt` in `hoodiePluginCryptoStore/salt`.

Rejects with:

Name 	| Status | Description | Why
------|--------|-------------|----
badarg | 500 | New password must be a string! | The new password wasn't a string.
badarg | 500 | password is to short! | The new password must be longer than 2 chars.
unauthorized | 401 | Reset-key is incorrect. | The entered `resetKey` is wrong.

Example
```javascript
async function userDidForgetPassword (resetKey) {
  try {
    const report = await hoodie.cryptoStore.resetPassword('my-old-password', 'secret')

    console.log('all documents are updated!')
    console.log(report.salt) // the new salt
    console.log(report.notUpdated) // array with all ids of encrypted docs that have not been updated

    // This can be: displaying the 10 keys to the user
    // or/and generate a text-file for the user to download.
    displayResetKeys(report.resetKeys)
  } catch (error) {
    console.error(error)
  }
}
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

Encrypt and add a document to the users store.

Argument      | Type   | Description                                     | Required
--------------|--------|-------------------------------------------------|----------
`properties`  | Object | properties of document                          | Yes
`properties._id` | String | If set, the document will be stored at given id | No

Resolves with decrypted `properties` and adds `id` (unless provided). And adds a `hoodie` property with `createdAt` and `updatedAt` properties. It will get encrypted.

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

Name 	| Status | Description | Why
------|--------|--------|-----
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Document must be a JSON object | `properties` isn't an object.
Conflict | 409 | Object with id "id" already exists | An object with this `_id` already exists.

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

Encrypt and add one or more documents to the users store.

Argument          | Type  | Description      | Required
------------------|-------|--------------------------|----------
`arrayOfProperties` | Array | Array of `properties`, see `cryptoStore.add(properties)`  | Yes

It adds `_id` (unless provided) and a `hoodie` property with `createdAt` and `updatedAt` properties. And encrypts them.

Resolves with an array of the added documents, decrypted.

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

Name 	| Status | Description | Why
------|--------|--------|-----
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Document must be a JSON object | `properties` isn't an object.
Conflict | 409 | Object with id "id" already exists | An object with this `_id` already exists.

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

Find a document in the users store. And decrypt encrypted documents.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes

Resolves with decrypted `properties`. Works on encrypted and not encrypted documents.

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

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
Not found | 404 | Object with id "id" is missing | There is no object with this `_id`.

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

Find a document in the users store. And decrypt encrypted documents.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`doc`   | Object | Document with `_id` property  | Yes

Resolves with decrypted `properties`. Works on encrypted and not encrypted documents.

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

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
Not found | 404 | Object with id "id" is missing | There is no object with this `_id`.

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

Find one or more documents in the users store. And decrypt encrypted documents.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`idsOrDocs` | Array | Array of `id` (String) or `doc` (Object) items  | Yes

Resolves with array of decrypted `properties`. Works on encrypted and not encrypted documents.

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

Name 	| Status | Description | Why
------|--------|--------|-----
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
Not found | 404 | Object with id "id" is missing | There is no object with this `_id`.

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

Find a document in the users store. And decrypt encrypted documents. If no document is present: `doc` will get added (and encrypted).

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes
`doc`   | Object | Document that will be saved if no document with the id exists | Yes

Resolves with decrypted `properties`. Works on encrypted and not encrypted documents. If doc gets added, it will also encrypt it and add a `hoodie` property with `createdAt` and `updatedAt` properties.

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
missing_id | 412 | \_id is required for puts | `id` is not a string or an object with an `_id`.

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

Find a document in the users store. And decrypt encrypted documents. If no document is present: `doc` will get added (and encrypted).

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`doc`   | Object | Document  with `_id` property | Yes

Resolves with decrypted `properties`. Works on encrypted and not encrypted documents. If doc gets added, it will also encrypt it and add a `hoodie` property with `createdAt` and `updatedAt` properties.

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|-----
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
missing_id | 412 | \_id is required for puts | `id` is not a string or an object with an `_id`.

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

Find one or more documents in the users store. And decrypt encrypted documents. If a document is not present: a new one will get added (and encrypted).

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`idsOrDocs` | Array | Array of documents with `_id` property or ids | Yes

Resolves with an array of decrypted `properties`. Works on encrypted and not encrypted documents. If a doc gets added, it will also encrypt it and add a `hoodie` property with `createdAt` and `updatedAt` properties.

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
missing_id | 412 | \_id is required for puts | `id` is not a string or an object with an `_id`.

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

Find all documents. And decrypt encrypted documents. The `filterFunction` filters out documents, the same way as `Array.prototype.filter` does.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`filterFunction` | Function | Function that will be called for every doc with `doc`, `index` and `arrayOfAllDocs`. And returns `true` if `doc` should be returned, `false` if not. | No

Resolves with array of decrypted `properties`. Works on encrypted and not encrypted documents.

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

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.

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

Find a document with `id` and update all changedProperties. Then encrypt it.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes
`changedProperties` | Object | Properties that should be changed | Yes

Resolves with updated decrypted `properties`. Works on encrypted and not encrypted documents. Not encrypted documents will get encrypted!

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Document must be a JSON object | `changedProperties` isn't an object.
not_found | 404 | missing | There is no object with this `_id`.
\- | \- | Must provide change | `changedProperties` isn't an object or function.

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

Find a document with `id` and update it with an updateFunction. Then encrypt it.

The document will be how the updateFunction changes it. This can add, update and delete field on the document.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes
`updateFunction` | Function | Function that get the document passed and changes the document. | Yes

Resolves with updated and decrypted `properties`. Works on encrypted and not encrypted documents. Not encrypted documents will get encrypted!

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Document must be a JSON object | `updateFunction` isn't an object or function.
not_found | 404 | missing | There is no object with this `_id`.
\- | \- | Must provide change | `updateFunction` isn't an object or function.

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

Find a document with `_id` of that object. And assigns all properties of this object to the doc. And then encrypts it.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`doc`   | Object | Properties that should be changed with a `_id` property | Yes

Resolves with updated and decrypted `properties`. Works on encrypted and not encrypted documents. Not encrypted documents will get encrypted!

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Document must be a JSON object | `doc` isn't an object with an `_id` field.
not_found | 404 | missing | There is no object with this `_id`.

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

Find one or more documents. It uses the `_id` of every object to find the document. Then all properties of that object will get assigned to the doc. And then encrypts it.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`arrayOfDocs` | Array | Array properties that should be changed with a `_id` property | Yes

Resolves with an array of updated and decrypted `properties`. Works on encrypted and not encrypted documents. Not encrypted documents will get encrypted!

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Document must be a JSON object | This element in the array isn't an object with an `_id` field.
not_found | 404 | missing | There is no object with this `_id`.

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

Try to find and update a doc with `id`. If none exist add one with `id` as its `_id' and doc as its properties. And encrypt the document.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes
`doc`   | Object | Properties that should be changed or added if doc doesn't exist | Yes

Resolves with updated and decrypted `properties`. Updates existing documents and adds nonexistent docs. Works on encrypted and not encrypted documents. Not encrypted documents will get encrypted! If the doc gets added, it will encrypt it and add a `hoodie` property with `createdAt` and `updatedAt` properties added.

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Document must be a JSON object | `doc` isn't an object.

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

Try to find and update a doc with `_id`. If none exist add this doc as it. And encrypt the document.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`doc`   | Object | Properties that should be changed or added with a `_id` property | Yes

Resolves with updated and decrypted `properties`. Updates existing documents and adds nonexistent docs. Works on encrypted and not encrypted documents. Not encrypted documents will get encrypted! If the doc gets added, it will encrypt it and add a `hoodie` property with `createdAt` and `updatedAt` properties added.

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Document must be a JSON object | `doc` isn't an object with an `_id` field.

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

Try to find and update one or more documents. It uses the `_id` of every object to find the document. If a document doesn't exist, that object will get added as it. And encrypt the document.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`arrayOfDocs` | Array | Array properties that should be changed or added with a `_id` property | Yes

Resolves with an array of updated and decrypted `properties`. Updates existing documents and adds nonexistent docs. Works on encrypted and not encrypted documents. Not encrypted documents will get encrypted! If the doc gets added, it will encrypt it and add a `hoodie` property with `createdAt` and `updatedAt` properties added.

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|-------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Document must be a JSON object | This element in the array isn't an object with an `_id` field.

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

Find all documents and update them. Assign `changedProperties` to every document. And then encrypt all documents.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`changedProperties` | Object | Properties that should be changed by all documents | Yes

Resolves with updated and decrypted `properties`. Works on encrypted and not encrypted documents. Not encrypted documents will get encrypted!

__This updates and encrypts all documents with its idPrefix!__

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
\- | \- | Must provide object or function | `changedProperties` isn't an object or a function.

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

Find all documents and update them. The `updateFunction` will be get called on every document. And then encrypt all documents.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`updateFunction` | Function | Function that get the document passed and changes the document. | Yes

Resolves with updated and decrypted `properties`. Works on encrypted and not encrypted documents. Not encrypted documents will get encrypted!

__This updates and encrypts all documents with its idPrefix!__

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|-------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
\- | \- | Must provide object or function | `changedProperties` isn't an object or a function.

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

Find a document with `id` and removes it.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`id`    | String | Unique id of the document  | Yes

Resolves with decrypted `properties`. Works on encrypted and not encrypted documents. It set the document to deleted. Not encrypted documents will get encrypted! It adds `deletedAt` to the `hoodie` property.

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

Name 	| Status | Description | Why
------|--------|--------|-------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
not_found | 404 | missing | There is no object with this `_id`.

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

Find a document using the `_id` of that doc. It will update, remove, and encrypt the document.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`doc`   | Object | Properties that should be changed with a `_id` property | Yes

Resolves with decrypted `properties`. Works on encrypted and not encrypted documents. It set the document to deleted and updates `properties`. Not encrypted documents will get encrypted! It adds `deletedAt` to the `hoodie` property.

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

Name 	| Status | Description | Why
------|--------|--------|-------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Document must be a JSON object | `doc` isn't an object with an `_id` field.
not_found | 404 | missing | There is no object with this `_id`.

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

Find one or more documents using the `_id` of that doc. It will update, remove, and encrypt all those documents.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`idsOrDocs`  | Array | Properties that should be changed with a `_id` property or ids | Yes

Resolves with decrypted `properties`. Works on encrypted and not encrypted documents. It set the document to deleted and updates `properties`. Not encrypted documents will get encrypted! It adds `deletedAt` to the `hoodie` property.

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

Name 	| Status | Description | Why
------|--------|--------|------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Document must be a JSON object | That element of the array isn't an object with an `_id` field or a string.
not_found | 404 | missing | There is no object with this `_id`.

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
cryptoStore.removeAll(filterFunction)
```

Remove all documents. If a `filterFunction` gets passed, it will behave like Array.prototype.filter. The resulting documents will get then removed and encrypted.

Argument| Type  | Description      | Required
--------|-------|--------------------------|----------
`filterFunction` | Function | Function that will be called for every doc with `doc`, `index` and `arrayOfAllDocs`. And returns `true` if `doc` should be returned, `false` if not. | No

Resolves with updated and decrypted `properties`. Works on encrypted and not encrypted documents. Not encrypted documents will get encrypted!

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

Name 	| Status | Description | Why
------|--------|--------|-------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.

Example

```javascript
// Just like Array.prototype.filter()
function filter (doc, index, allDocs) {
  return index % 2 === 0
}

hoodie.cryptoStore.removeAll(filter).then(function (docs) {
  console.log(docs.length)
}).catch(function (error) {
  console.error(error)
})
```

### cryptoStore.isEncrypted(object)

```javascript
cryptoStore.isEncrypted(object)
```

Checks if the object matches the structure of an encrypted document.

Argument| Type  | Description      | Required
--------|-------|------------------|----------
`object` | Object | Document or object to be checked if it has the structure of an encrypted document. | Yes

Returns a Boolean. Returns `true` if the passed object matches and encrypted document, and `false` if it is not.

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|-------
bad_request | 400 | Document must be a JSON object | `object` isn't an object.

Example

```javascript
async function test () {
  const obj = await hoodie.cryptoStore.add({
    _id: 'test',
    value: 3
  })

  hoodie.cryptoStore.isEncrypted(obj) // false; because the obj was decrypted!

  const doc = await hoodie.store.find('test')

  return hoodie.cryptoStore.isEncrypted(doc) // will return true
}
```

### cryptoStore.isEncrypted(Promise)

```javascript
cryptoStore.isEncrypted(Promise.resolve(object))
```

Resolves the Promise. Then checks if the resulting object matches the structure of an encrypted document.

Argument| Type  | Description      | Required
--------|-------|------------------|----------
`Promise` | Promise<Object> | Promise that will resolve into an Object. That object will then be check if it has the structure of an encrypted document. | Yes

Resolves a Boolean. Resolves `true` if the passed object matches and encrypted document, and `false` if it is not.

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|-------
bad_request | 400 | Document must be a JSON object | `object` isn't an object.
Error | - | - | Rejects with that error the passed Promise rejects to.

Example

```javascript
function isEncrypted (id) {
  return hoodie.cryptoStore.isEncrypted(
    hoodie.store.find(id)
  )
}
```

### cryptoStore.encrypt(jsonValue, aad)

```javascript
cryptoStore.encrypt(['test', true])
```

Encrypt any JSON-data without storing them. Uses the same encryption key as any other method.

Argument| Type  | Description      | Required
--------|-------|------------------|----------
`jsonValue` | Any valid JSON value | Data that should be encrypted. This can be anything that can also be passed to `JSON.stringify()` | Yes
`aad` | String or Buffer/TypedArray | Optional additional validation. If present, then it __must__ also be present and the same value/content when decrypting. | No

Resolves with an object containing the value encrypted.

This method encrypts __everything__. It will not use [`cy_ignore` or `__cy_ignore`](#select-fields-that-shouldnt-get-encrypted)! `undefined` will get encrypted as `null`.

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|-------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.

### cryptoStore.decrypt(encrypted, aad)

```javascript
cryptoStore.decrypt(encryptedData)
```

Decrypt everything encrypted with [`cryptoStore.encrypt()`](#cryptostoreencryptjsonvalue-aad). Uses the same encryption key as any other method.

Argument| Type  | Description      | Required
--------|-------|------------------|----------
`encrypted` | object | Data that is encrypted with [`cryptoStore.encrypt()`](#cryptostoreencryptjsonvalue-aad). All fields on the object other then `data`, `tag` and `nonce` will be ignored. | Yes
`aad` | String or Buffer/TypedArray | Optional additional validation. Required if it was present when encrypting. | No

Resolves with original data.

Rejects with:

Name 	| Status | Description | Why
------|--------|--------|-------
unauthorized | 401 | Name or password is incorrect. | This plugin wasn't unlocked yet.
bad_request | 400 | Data was undefined. Data is must be an object! | `encrypted` was `undefined` or `null`.
bad_request | 400 | Data was not an Object with the required fields. It must be an object with data, tag and nonce! | `encrypted` didn't contain `data`, `tag` or `nonce`. All three must be strings.
_ | _ | Unsupported state or unable to authenticate data | `aad` (additional authentication data) didn't match.

### cryptoStore.on()

```javascript
cryptoStore.on(eventName, handler)
```

Add an event-handler. It behaves like [hoodie-store-client's on](https://github.com/hoodiehq/hoodie-store-client#storeon). But will not emit events for not encrypted documents or documents it couldn't decrypted. It will also decrypt the document.

Argument| Type  | Description      | Required
--------|-------|------------------|----------
`eventName` | String | Event type. One of `add`, `update`, `remove` or `change`. | Yes
`handler` | Function | Event Handler, that will be called every time that event emits. | Yes

Returns the `cryptoStore`. `handler` will get called with an updated doc. If the event is `change`, than the first argument is a `eventName`.

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

Add an one-time event-handler. It behaves like [hoodie-store-client's one](https://github.com/hoodiehq/hoodie-store-client#storeone). But will not emit events for not encrypted documents or documents it couldn't decrypted. It will also decrypt the document.

Argument| Type  | Description      | Required
--------|-------|------------------|----------
`eventName` | String | Event type. One of `add`, `update`, `remove` or `change`. | Yes
`handler` | Function | Event Handler, that will be called one time that event emits. | Yes

Returns the `cryptoStore`. `handler` will get called with an updated doc. If the event is `change`, than the first argument is a `eventName`. After that event get emitted, that handler will get removed.

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

Remove an event-handler. It behaves like [hoodie-store-client's off](https://github.com/hoodiehq/hoodie-store-client#storeoff).

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

Returns subset of `cryptoStore` API with `_id` property implicitly prefixed by passed string.

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

Resolves with an `object` containing the used `salt` and a subset of `cryptoStore` API. This API will have the `encryption key` from `password` and `salt`. If no `salt` or a now correct one, got passed, a new salt will get created.

This also works if the main instance isn't unlocked!

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
