'use strict'

module.exports = encryptDoc

var includes = require('lodash/includes')
var randomBytes = require('randombytes')
var Promise = require('lie')
var uuid = require('uuid').v4

var encrypt = require('./helpers/encrypt-core')
var ignore = require('./utils/ignore.js')

// Listed in CouchDB's documentation
// https://docs.couchdb.org/en/stable/api/ddoc/common.html#put--db-_design-ddoc
var designDocIgnoreFields = [
  'language',
  'options',
  'filters',
  'lists',
  'rewrites',
  'shows',
  'updates',
  'validate_doc_update',
  'views',
  'autoupdate'
]

// Mostly copied from https://github.com/calvinmetcalf/crypto-pouch/blob/master/index.js#L130
function encryptDoc (state, doc, prefix) {
  if (!state.key || state.key.length !== 32) {
    return Promise.reject(new TypeError('No valid key set! Please unlock the cryptoStore first!'))
  }

  var nonce = randomBytes(12)
  var outDoc = {
    _id: '',
    _rev: null,
    hoodie: null,
    tag: '',
    data: '',
    nonce: nonce.toString('hex')
  }
  var encryptDoc = {}

  var isDesignDoc = ((prefix == null || prefix === '') && /^_design\//.test(doc._id)) ||
    (typeof prefix === 'string' && /^_design\//.test(prefix))

  var docIgnore = ignore.concat(
    Array.isArray(doc.cy_ignore) ? doc.cy_ignore : [],
    Array.isArray(doc.__cy_ignore) ? doc.__cy_ignore : [],
    isDesignDoc ? designDocIgnoreFields : []
  )

  Object.getOwnPropertyNames(doc).forEach(function (key) {
    if (doc[key] === undefined || key === '__cy_ignore') return

    if ((state.handleSpecialMembers && key.charAt(0) === '_') || includes(docIgnore, key)) {
      outDoc[key] = doc[key]
    } else {
      encryptDoc[key] = doc[key]
    }
  })

  if (!outDoc._id) {
    outDoc._id = uuid()
  }
  if (prefix) {
    outDoc._id = prefix + outDoc._id
  }

  var data = Buffer.from(JSON.stringify(encryptDoc))
  return encrypt(state.key, nonce, data, Buffer.from(outDoc._id))

    .then(function (result) {
      outDoc.tag = result.tag
      outDoc.data = result.data
      return outDoc
    })
}
