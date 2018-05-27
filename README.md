# hoodie-plugin-store-crypto
> End-to-end crypto plugin for the Hoodie client store.

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.com/Terreii/hoodie-plugin-store-crypto.svg?token=FkVUWJx8T235m9RhFUzT&branch=latest)](https://travis-ci.com/Terreii/hoodie-plugin-store-crypto)
[![dependencies Status](https://david-dm.org/Terreii/hoodie-plugin-store-crypto/status.svg)](https://david-dm.org/Terreii/hoodie-plugin-store-crypto)
[![devDependencies Status](https://david-dm.org/Terreii/hoodie-plugin-store-crypto/dev-status.svg)](https://david-dm.org/Terreii/hoodie-plugin-store-crypto?type=dev)

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

- To result the same behaviour, many of the tests in this plugin are adjusted versions of [hoodie-store-client](https://github.com/hoodiehq/hoodie-store-client) tests.
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
hoodie   | Object | Hoodie client instance | Yes

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
password | String | A password for encrypting the objects | Yes

Resolves with a `salt`. A salt is a string that will be used with the password together for the encryption.
It should be saved in plain text.

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
        .then(function (salt) {
          hoodie.store.add({
            _id: 'cryptoSalt',
            salt: salt
          })
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
password | String | A password for encrypting the objects | Yes
salt     | String | A string generated by `setPassword(password)`, to add another protection lair, as a second password. | Yes

Resolves with a `salt`. A salt is a string that will be used with the password together for the encryption.
It should be saved in plain text.

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
properties    | Object | properties of document                          | Yes
properties.id | String | If set, the document will be stored at given id | No

Resolves with `properties` and adds `id` (unless provided). And adds a `hoodie` propertie with `createdAt` and `updatedAt` properties.

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
arrayOfProperties | Array | Array of `properties`, see `cryptoStore.add(properties)`  | Yes

Resolves with an array of `properties` in the `arrayOfProperties` and adds `_id` (unless provided). And adds a `hoodie` propertie with `createdAt` and `updatedAt` properties.

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

### cryptoStore.find(doc)

### cryptoStore.find(idsOrDocs)

### cryptoStore.findOrAdd(id, doc)

### cryptoStore.findOrAdd(doc)

### cryptoStore.findOrAdd(idsOrDocs)

### cryptoStore.findAll()

### cryptoStore.update(id, changedProperties)

### cryptoStore.update(id, updateFunction)

### cryptoStore.update(doc)

### cryptoStore.update(arrayOfDocs)

### cryptoStore.updateOrAdd(id, doc)

### cryptoStore.updateOrAdd(doc)

### cryptoStore.updateOrAdd(arrayOfDocs)

### cryptoStore.updateAll(changedProperties)

### cryptoStore.updateAll(updateFunction)

### cryptoStore.remove(id)

### cryptoStore.remove(doc)

### cryptoStore.remove(idsOrDocs)

### cryptoStore.removeAll()

### cryptoStore.on()

### cryptoStore.one()

### cryptoStore.off()

### cryptoStore.withIdPrefix

### cryptoStore.withPassword

### Events

