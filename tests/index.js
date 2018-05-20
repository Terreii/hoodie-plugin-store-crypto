'use strict'

require('./unit/create-key-test')
require('./unit/encrypt-test')
require('./unit/decrypt-test')

require('./integration/crypto-test')
require('./integration/add')
require('./integration/find')
require('./integration/find-all')
require('./integration/find-or-add.js')
require('./integration/update')
require('./integration/update-or-add')
require('./integration/update-all')
require('./integration/remove')
require('./integration/remove-all')
require('./integration/with-id-prefix')
require('./integration/events')
require('./integration/with-password')
