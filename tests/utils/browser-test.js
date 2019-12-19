'use strict'

module.exports = browserTest

const browserify = require('browserify')
const puppeteerChrome = require('puppeteer')
const puppeteerFirefox = require('puppeteer-firefox')

const browsers = {
  chrome: puppeteerChrome,
  firefox: puppeteerFirefox
}

/**
 * Run a test in a browser and returns the result of the test function.
 * @param {'chrome'|'firefox'} browserName Name of the browser that should be used for this test.
 * @param {string} modulePath Path of the to testing module. Relative to the project directory.
 * @param {string} exportName Name used for the export of the module.
 * @param {function} fn Test function. This function will be run in the browser.
 */
async function browserTest (browserName, modulePath, exportName, fn) {
  const browser = await browsers[browserName].launch()

  try {
    const browserifyInstance = browserify(modulePath, {
      standalone: exportName
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

    const result = await page.evaluate(fn)

    await browser.close()

    return result
  } catch (err) {
    await browser.close()
    throw err
  }
}
