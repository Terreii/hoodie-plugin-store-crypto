'use strict'

const test = require('tape')
const browserify = require('browserify')
const puppeteerChrome = require('puppeteer')
const puppeteerFirefox = require('puppeteer-firefox')

const createKey = require('../../lib/create-key')

test('create a key', async t => {
  t.plan(2)

  const password = 'test'

  const result = await createKey(password, 'bf11fa9bafca73586e103d60898989d4')

  t.equal(
    result.key.toString('hex'),
    '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c',
    'generated key from password "test" with salt "bf11fa9bafca73586e103d60898989d4"'
  )

  t.equal(result.salt, 'bf11fa9bafca73586e103d60898989d4', 'returned salt')
})

test('create a key and salt if no salt was passed', async t => {
  t.plan(2)

  const password = 'test'

  const result = await createKey(password)

  t.ok(result.key.length > 0, 'generated key')

  t.ok(result.salt.length === 32, 'generated salt')
})

test('create a key in chrome', async t => {
  t.plan(2)

  const browser = await puppeteerChrome.launch()

  try {
    const browserifyInstance = browserify('./lib/create-key', {
      standalone: 'createKey'
    })

    const scriptContent = await new Promise((resolve, reject) => {
      const stream = browserifyInstance.bundle()

      let scriptContent = ''
      stream.on('data', chunk => { scriptContent += chunk })

      stream.on('end', () => { resolve(scriptContent) })
      stream.on('error', reject)
    })

    const page = await browser.newPage()
    await page.addScriptTag({ content: scriptContent })

    const keyResult = await page.evaluate(() => {
      const test = async () => {
        const result = await createKey('test', 'bf11fa9bafca73586e103d60898989d4')
        return {
          key: result.key.toString('hex'),
          salt: result.salt
        }
      }
      return test()
    })

    t.is(
      keyResult.key,
      '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c',
      'generated key from password "test" with salt "bf11fa9bafca73586e103d60898989d4"'
    )

    t.is(keyResult.salt, 'bf11fa9bafca73586e103d60898989d4', 'returned salt')
  } catch (err) {
    t.end(err)
  } finally {
    await browser.close()
  }
})

test('create a key in Firefox', async t => {
  t.plan(2)

  const browser = await puppeteerFirefox.launch()

  try {
    const browserifyInstance = browserify('./lib/create-key', {
      standalone: 'createKey'
    })

    const scriptContent = await new Promise((resolve, reject) => {
      const stream = browserifyInstance.bundle()

      let scriptContent = ''
      stream.on('data', chunk => { scriptContent += chunk })

      stream.on('end', () => { resolve(scriptContent) })
      stream.on('error', reject)
    })

    const page = await browser.newPage()
    await page.addScriptTag({ content: scriptContent })

    const keyResult = await page.evaluate(() => {
      const test = async () => {
        const result = await createKey('test', 'bf11fa9bafca73586e103d60898989d4')
        return {
          key: result.key.toString('hex'),
          salt: result.salt
        }
      }
      return test()
    })

    t.is(
      keyResult.key,
      '8ecab44b2448d6bae235476a134be8f6bec705a35a02dea3afb4e648f29eb66c',
      'generated key from password "test" with salt "bf11fa9bafca73586e103d60898989d4"'
    )

    t.is(keyResult.salt, 'bf11fa9bafca73586e103d60898989d4', 'returned salt')
  } catch (err) {
    t.end(err)
  } finally {
    await browser.close()
  }
})
