# hoodie-plugin-store-crypto
> End-to-end crypto plugin for the Hoodie client store.

This [Hoodie](http://hood.ie/) plugin adds methods, to store and read encrypted
documents in your store, while still being able to store and read unencrypted
documents.

There is no server side to this plugin!

## Usage

First, install the plugin as dependency of your Hoodie app

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

You can now start your app with `npm start`. There should now be an `eteCrypto`
property on your client `hoodie` instance. You can access it with
`hoodie.eteCrypto`.

### Usage with Browserify or Webpack

If you are using a client bundler (e.g. [Browserify](http://browserify.org/)
or [Webpack](https://webpack.js.org)), then you can import it manually.

First, install the plugin as dev-dependency of your Hoodie app

```js
npm install --save-dev hoodie-plugin-store-crypto
```

Then require it and set it up:

```javascript
var hoodie = require('@hoodie/client')
var eteCrypto = require('hoodie-plugin-store-crypto')

eteCrypto(hoodie) // sets up hoodie.eteCrypto
```
