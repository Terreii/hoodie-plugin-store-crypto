| index | [API] | [about cryptography] | [update] | [Contributing] | [Code of Conduct] |
|-------|-------|----------------------|----------|----------------|-------------------|

# hoodie-plugin-store-crypto
> End-to-end crypto plugin for the Hoodie client store.

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.com/Terreii/hoodie-plugin-store-crypto.svg?token=FkVUWJx8T235m9RhFUzT&branch=latest)](https://travis-ci.com/Terreii/hoodie-plugin-store-crypto)
[![dependencies Status](https://david-dm.org/Terreii/hoodie-plugin-store-crypto/status.svg)](https://david-dm.org/Terreii/hoodie-plugin-store-crypto)
[![devDependencies Status](https://david-dm.org/Terreii/hoodie-plugin-store-crypto/dev-status.svg)](https://david-dm.org/Terreii/hoodie-plugin-store-crypto?type=dev)
[![Greenkeeper badge](https://badges.greenkeeper.io/Terreii/hoodie-plugin-store-crypto.svg)](https://greenkeeper.io/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm](https://img.shields.io/npm/v/hoodie-plugin-store-crypto)](https://www.npmjs.com/package/hoodie-plugin-store-crypto)

This [Hoodie](http://hood.ie/) plugin adds methods, to add, read, update and delete encrypted
documents in your users store, while still being able to add, read, update and delete un-encrypted
documents.

It does this by adding an object to your Hoodie-client, with similar methods
to the client's store. Those methods encrypt and decrypt objects, while using the
corresponding methods from Hoodie to save them.

There is no server side to this plugin!

**Everything of a doc will get encrypted. Except for `_id`, `_rev`, `_deleted`, `_attachments`, `_conflicts` and the `hoodie` object!**

## Example
```js
hoodie.store.add({foo: 'bar'})
  .then(function (obj) { console.log(obj) })

hoodie.cryptoStore.setup('secret')
  .then(async () => {
    await hoodie.cryptoStore.unlock('secret')

    const obj = await hoodie.cryptoStore.add({ foo: 'bar' }) // add the object encrypted
    console.log(obj)                                         // returns it un-encrypted!

    const encrypted = await hoodie.store.find(obj._id) // returns the encrypted version of the object.
    /*
    encrypted = {
      // Added by Hoodie:
      _id: 'e261b431-9f8b-44d8-9835-97be550088d5',
      _rev: '1-b9c5a6b9353e4dfcaf5a9183da02a647',
      hoodie: {
        createdAt: 'An ISO-Date'
      },

      // Encrypted data:
      data: '09ae27028776974ef291030b85',
      nonce: 'f04ad8243a5ab2f59cc4a174',
      tag: '9b01f13a765ed9351d97a11bba48e7b4'
    }
    */
  })
```

## Table of Contents

- [Acknowledgments](#acknowledgments)
- Usage
  - [Add it to your Hoodie-Client](#add-it-to-your-hoodie-client)
    - [with the Hoodie Plugin API](#usage-with-the-hoodie-plugin-api)
    - [with Browserify or Webpack](#usage-with-browserify-or-webpack)
  - [Get started](#get-started)
    - [Sign up / setup / start of using encryption](#setup)
    - [Sign in / unlocking](#sign-in)
    - [Open a tap/instance of your web-app if they are already signed in](#open-your-app-while-signed-in)
    - [changing the password for encryption](#changing-the-password)
    - [reset the password](#reset-the-password)
- [Contributing](#contributing)
  - [Setup for development](#setup-development)
  - [npm scripts](#npm-scripts)

## Acknowledgments
This project heavily uses code and inspiration by
[@calvinmetcalf's crypto-pouch](https://github.com/calvinmetcalf/crypto-pouch)
and Hoodie's [hoodie-store-client](https://github.com/hoodiehq/hoodie-store-client).

Thank you to those projects and their maintainers.

- To result the same behavior, this plugin uses some adjusted versions of [hoodie-store-client](https://github.com/hoodiehq/hoodie-store-client) tests.
- The Encryption used here is an inspired versions of [@calvinmetcalf's crypto-pouch's](https://github.com/calvinmetcalf/crypto-pouch) encryption functions.

## Usage

### Add it to your Hoodie-Client

There are 2 ways to use this plugin in your app:
- Use it with the Hoodie Plugin API
- Use it with a bundler (Webpack or Browserify)

#### Usage with the Hoodie Plugin API

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

[Back to top](#table-of-contents)

#### Usage with Browserify or Webpack

If you are using a client bundler (e.g. [Browserify](http://browserify.org/)
or [Webpack](https://webpack.js.org)), then you can import it manually.

First, install the plugin as dev-dependency of your Hoodie app:

```js
npm install --save-dev hoodie-plugin-store-crypto
```

Then import it and set it up:

```javascript
var Hoodie = require('@hoodie/client')
var PouchDB = require('pouchdb')
var cryptoStore = require('hoodie-plugin-store-crypto')

var hoodie = new Hoodie({ // create an instance of the hoodie-client
  url: window.location.origin,
  PouchDB: PouchDB
})

cryptoStore(hoodie) // sets up hoodie.cryptoStore
```

[Back to top](#table-of-contents)

### Get started

To use the cryptoStore you need to set a password for encryption. This can be your users password to
your app, or a special password, which they will enter or you generate.

There are 5 use-cases you must put in place:

- [Sign up / setup / start of using encryption](#setup)
- [Sign in / unlocking](#sign-in)
- [Open a tap/instance of your web-app if they are already signed in](#open-your-app-while-signed-in)
- [changing the password for encryption](#changing-the-password)
- [reset the password](#reset-the-password)

#### Setup

The first use of the cryptoStore. Setup can get done in your sign up function, but also if
you newly added this plugin.

Use [`cryptoStore.setup(password, [salt])`](#cryptostoresetuppassword) to set the
encryption password. __`cryptoStore.setup(password, [salt])` will not unlock your cryptoStore instance__
(just like hoodie.account.signUp)!

A salt is a second part of a password. `cryptoStore.setup(password, [salt])` will save the generated salt in `hoodiePluginCryptoStore/salt`, and use it. [More about what the salt is](http://www.passwordbreeder.com/page/salt).

Example:
```javascript
async function signUp (username, password, cryptoPassword) {
  const accountProperties = await hoodie.account.signUp({
    username: username,
    password: password
  })

  const resetKeys = await hoodie.cryptoStore.setup(cryptoPassword)

  displayResetKeys(resetKeys)

  return signIn(username, password, cryptoPassword) // Call your signIn function
}
```

[Back to top](#table-of-contents)

#### Sign in

Every time your user signs in you also need to unlock the cryptoStore.

Use [`cryptoStore.unlock(password)`](#cryptostoreunlockpassword) for unlocking.

`unlock` will try to pull `hoodiePluginCryptoStore/salt` from the server. To have the latest version of it.

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

[Back to top](#table-of-contents)

#### Sign out

`cryptoStore` will automatically listen to [`account.on('signout')`](http://docs.hood.ie/en/latest/api/client/hoodie.account.html#events) events. And locks itself if it emits an event. You don't need to add any setup for it.

Use-cases for the [`cryptoStore.lock()`](#cryptostorelock) method are:
 - a lock after a timeout functionality
 - lock the store in a save way when closing an tab.

```javascript
window.addEventListener('beforeunload', function (event) {
  // do your cleanup
  // lock the cryptoStore in an cryptographic saver way.
  // It overwrites the key data 10 times.
  hoodie.cryptoStore.lock()
})
```

[Back to top](#table-of-contents)

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

[Back to top](#table-of-contents)

#### Changing the password

You can change the password and salt used for encryption with [`cryptoStore.changePassword(oldPassword, newPassword)`](#cryptostorechangepasswordoldpassword-newpassword).
This method also updates all documents, that got encrypted with the old password!

Please sync before the password change! To update all documents.

Example:
```javascript
async function changePassword (oldPassword, newPassword) {
  await hoodie.connectionStatus.check() // check if your app is online

  if (hoodie.connectionStatus.ok) { // if your app is online: sync your users store
    await hoodie.store.sync()
  }

  const result = await hoodie.cryptoStore.changePassword(oldPassword, newPassword)

  console.log(result.notUpdated) // array of ids of all docs that weren't updated

  displayResetKeys(result.resetKeys)
}
```

[Back to top](#table-of-contents)

#### Reset the password

This works like [changing the password](#changing-the-password). With the difference of:
The user must enter a __reset-key__ not the old password, and calling `resetPassword()`!

`setup()`, `changePassword()` and `resetPassword()` result 10 reset-keys. You should display them to your user.
Or/and generate a text-file for your user to download.

```javascript
// Generate a text file with the reset keys in it.
function generateResetKeysFile (resetKeys) {
  const text = resetKeys.join('\n')
  const file = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(file)

  const a = document.getElementById('yourDownloadLink')
  a.href = url
  a.download = '[Your app name] reset-keys.txt' // This will be the standard file name.

  // then call later URL.revokeObjectURL(url) with the url of the file.
  // To remove it from memory.
}
```

Then, when the user did forget their encryption password, call `cryptoStore.resetPassword(aResetKey, newPassword)`.

Every resetKey has a doc. Their `_id` starts with `hoodiePluginCryptoStore/pwReset_`, followed with the number 0 to 9. Please don't change them!

[Back to top](#table-of-contents)

## Contributing

Contributions in all forms are welcome♡

[Contributing] might answer your questions about Contributing.

To create a welcoming project to all, this project uses a [Code of Conduct]. Please read it.

### Setup development

hoodie-plugin-store-crypto is a [node.js](https://nodejs.org/) package. You need node version 6 or higher and npm version 5 or higher. Check your installed version with `node -v`and `npm -v`.

```
git clone https://github.com/Terreii/hoodie-plugin-store-crypto.git
cd hoodie-plugin-store-crypto
npm install
```

### npm scripts

Scripts for development.

Command | What it does
--------|-------
`npm start` | Starts a Hoodie-server with this plugin attached.
`npm test` | Run all tests.
`npm run textlint` | Lint the documentation.
`npm run fix:docs` | Fix some lint errors in the documentation.
`npm run fix:style` | Fix some code-style errors.
`npm run update-coc` | Update the __Code of Conduct.md__.
`npm run update-contrib` | Update the __Contributing.md__.

[Back to top](#table-of-contents)

[API]: docs/api.md
[about cryptography]: docs/about_cryptography.md
[update]: docs/update.md
[Contributing]: CONTRIBUTING.md
[Code of Conduct]: CODE_OF_CONDUCT.md
