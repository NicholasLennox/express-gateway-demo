// Normal body temperature sits around 36.5-37.5 °C. Readings cluster around the
// average, with the occasional one further out, the way a real monitor would.
const AVERAGE = 36.9
const SPREAD = 0.3
const MIN = 34.0
const MAX = 42.0

// A normally distributed random number (Box-Muller transform). Math.random()
// on its own gives every value in the range the same chance, which doesn't
// look like a real patient.
function randomNormal (average, spread) {
  const u = 1 - Math.random()
  const v = Math.random()

  return average + spread * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function generateReading () {
  const celsius = Math.round(randomNormal(AVERAGE, SPREAD) * 10) / 10

  return {
    type: 'temperature',
    value: Math.min(MAX, Math.max(MIN, celsius)),
    unit: '°C',
    timestamp: new Date().toISOString()
  }
}

module.exports = { generateReading }
