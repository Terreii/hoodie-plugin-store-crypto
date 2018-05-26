# hoodie-plugin-store-crypto
> End-to-end crypto plugin for the Hoodie client store.

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.com/Terreii/hoodie-plugin-store-crypto.svg?token=FkVUWJx8T235m9RhFUzT&branch=latest)](https://travis-ci.com/Terreii/hoodie-plugin-store-crypto)

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
- [cryptoStore.setPassword(password, salt)](#cryptostoresetpasswordpasspord-salt)
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

### cryptoStore.setPassword(passpord, salt)

### cryptoStore.add(properties)

### cryptoStore.add(arrayOfProperties)

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

