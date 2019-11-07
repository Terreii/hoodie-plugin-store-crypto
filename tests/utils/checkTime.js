'use strict'

module.exports = checkTime

function checkTime (startTime, objectTime) {
  startTime = startTime instanceof Date ? startTime : new Date(startTime)

  const now = Date.now()

  const timeObj = new Date(objectTime)
  const isoString = timeObj.toISOString()
  const time = timeObj.getTime()

  if (objectTime !== isoString) {
    throw new Error('it must be an isoString! Not "' + objectTime + '"')
  }

  if (time < startTime.getTime()) {
    throw new Error('time must be at or after the start time!')
  }

  if (time > now) {
    throw new Error('time must be at or before now!')
  }

  return true
}
