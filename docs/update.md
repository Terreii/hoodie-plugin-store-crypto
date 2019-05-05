| [index](../README.md) | [API](./api.md) | [about cryptography](./about_cryptography.md) | update | [Contributing](../CONTRIBUTING.md) | [Code of Conduct](../CODE_OF_CONDUCT.md) |
|-----------------------|-----------------|-----------------------------------------------|--------|-----------------------------------|------------------------------------------|

# Update Notes

This document will provide an update path for you.

It will list all changes, you have to make, if you update to:

- [v2](#v2updatenotes)
- [v2.2](#v22updatenotes)

## v2 Update Notes

### setPassword

`setPassword` got split into `setup` and `unlock`.

### Fail if not unlocked

All reading and writing methods fail now if this plugin wasn't unlocked!

### Checking the Password

__*v1 didn't check if the entered password was correct!* This version does now!__
It uses an encrypted random string in the `hoodiePluginCryptoStore/salt` doc. Saved in the `check`-field. With the same encryption as the other docs. It will get added/updated with `setup` and `changePassword`.

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

__It will still unlock, if no password check is present on the salt-doc!__ But it will add a check as soon as the first encrypted doc got read without an error!

This is to ensure backwards compatibility.

__The password check autofix can get deactivated__

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

Then no password check will get added, until the next password change.

## v2.2 Update Notes

This version adds __password-resetKeys__. Display them to your user. If the user forgets their password, they can
reset their password, using one of the 10 reset keys.

They get generated by:
- `setup`
- `changePassword`
- `resetPassword`

__If the user was already setup, then no reset key will get generated, until the next password change!__