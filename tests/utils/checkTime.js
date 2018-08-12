'use strict'

module.exports = checkTime

function checkTime (startTime, objectTime) {
  startTime = startTime instanceof Date ? startTime : new Date(startTime)

  var now = Date.now()

  var timeObj = new Date(objectTime)
  var isoString = timeObj.toISOString()
  var time = timeObj.getTime()

  return time <= now && time >= startTime.getTime() && objectTime === isoString
}
