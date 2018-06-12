# hoodie-plugin-store-crypto
> End-to-end crypto plugin for the Hoodie client store.

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.com/Terreii/hoodie-plugin-store-crypto.svg?token=FkVUWJx8T235m9RhFUzT&branch=latest)](https://travis-ci.com/Terreii/hoodie-plugin-store-crypto)
[![dependencies Status](https://david-dm.org/Terreii/hoodie-plugin-store-crypto/status.svg)](https://david-dm.org/Terreii/hoodie-plugin-store-crypto)
[![devDependencies Status](https://david-dm.org/Terreii/hoodie-plugin-store-crypto/dev-status.svg)](https://david-dm.org/Terreii/hoodie-plugin-store-crypto?type=dev)
[![Greenkeeper badge](https://badges.greenkeeper.io/Terreii/hoodie-plugin-store-crypto.svg)](https://greenkeeper.io/)

This [Hoodie](http://hood.ie/) plugin adds methods, to add, read and update encrypted
documents in your users store, while still being able to add, read and update unencrypted
documents.

It does this by adding an object to your Hoodie-client, with similar methods
to the client's store. Those methods encrypt and decrypt objects, while using the
corresponding methods from Hoodie to save them.

There is no server side to this plugin!

## Example
```js
hoodie.store.add({foo: 'bar'})
  .then(function (obj) {console.log(obj)})

hoodie.cryptoStore.setPassword('secret')        // unlock
  .then(function (salt) {
    hoodie.cryptoStore.add({foo: 'bar'})        // adds the object encrypted
      .then(function (obj) {console.log(obj)})  // returns it unencrypted!
  })
```

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

- [Sign up / start of using encryption](#sign-up)
- [Sign in](#sign-in)
- [Open a tap/instance of your web-app if they are already signed in](#open-your-app-while-signed-in)
- [changing the password for encryption](#changing-the-password)

#### Sign up

The first use of the cryptoStore. This is usually in your sign up function, but can also be done if
you newly added this plugin.

[`cryptoStore.setPassword(password)`](#cryptostoresetpasswordpassword) is used to set the
encryption password. It will resolve with a `salt`. A salt is a second part of a password.
`cryptoStore.setPassword(password)` will save the generated salt in `_design/cryptoStore/salt`, and
use it.

Example:
```javascript
function signUp (username, password, cryptoPassword) {
  return hoodie.account.signUp({username: username, password: password})

    .then(function (accountProperties) {
      return hoodie.cryptoStore.setPassword(cryptoPassword)

        .then(function (salt) {
          // now do what you do after you did sign up a user.
        })
    })
}
```

#### Sign in

#### Open your app while signed in

#### Changing the password

## API

- [cryptoStore (setup function)](#cryptostore-setup-function)
- [cryptoStore.setPassword(password)](#cryptostoresetpasswordpassword)
- [cryptoStore.setPassword(password, salt)](#cryptostoresetpasswordpassword-salt)
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
cryptoStore(hoodie)
```

Argument | Type   | Description | Required
---------|--------|-------------|----------
`hoodie` | Object | Hoodie client instance | Yes

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

hoodie.cryptoStore.setPassword('test')
  .then(function (salt) {
    console.log('done')
  })
```

### cryptoStore.setPassword(password)

```javascript
cryptoStore.setPassword(password)
```

Argument | Type   | Description                           | Required
---------|--------|---------------------------------------|----------
`password` | String | A password for encrypting the objects | Yes

Resolves with a `salt`. A salt is a string that will be used with the password together for the encryption.
It is saved with the `id` `_design/cryptoStore/salt`.

It doesn't reject!

Example
```javascript
function signUp (accountProperties, encryptionPW) {
  hoodie.account.signUp(accountProperties)
    .then(function () {
      if (encryptionPW == null) {                  // Use a separate password for encryption or the same
        encryptionPW = accountProperties.password
      }
      return hoodie.cryptoStore.setPassword(encryptionPW)
        .then(function (salt) { // Salt is saved for you under `_design/cryptoStore/salt`
          console.log('Encryption is enabled!')
        })
    })
}
```

### cryptoStore.setPassword(password, salt)

```javascript
cryptoStore.setPassword(password, salt)
```

Argument | Type   | Description                           | Required
---------|--------|---------------------------------------|----------
`password` | String | A password for encrypting the objects | Yes
`salt`   | String | A string generated by `setPassword(password)`, to add another protection lair, as a second password. If this is missing, a salt will be generated. Which will result in a different encryption! | Yes

Resolves with a `salt`. A salt is a string that will be used with the password together for the encryption.
It is saved with the `id` `_design/cryptoStore/salt`.

It doesn't reject!

Example
```javascript
function signIn (accountProperties, encryptionPW) {
  hoodie.account.signIn(accountProperties)
    .then(function () {
      return hoodie.store.find('cryptoSalt')
    })
    .then(function (saltObj) {
      if (encryptionPW == null) {                  // Use a separate password for encryption or the same
        encryptionPW = accountProperties.password
      }
      return hoodie.cryptoStore.setPassword(encryptionPW, saltObj.salt)
    })
    .then(function (salt) {
      console.log('you did sign in!')
    })
}
```

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

Rejects with:

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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

Name 	| Description
------|--------
Error |	...

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
