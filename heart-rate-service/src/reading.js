// Resting adult heart rate sits around 60-100 bpm. Readings cluster around the
// average, with the occasional one further out, the way a real monitor would.
const AVERAGE = 72
const SPREAD = 8
const MIN = 40
const MAX = 180

// A normally distributed random number (Box-Muller transform). Math.random()
// on its own gives every value in the range the same chance, which doesn't
// look like a real patient.
function randomNormal (average, spread) {
  const u = 1 - Math.random()
  const v = Math.random()

  return average + spread * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function generateReading () {
  const bpm = Math.round(randomNormal(AVERAGE, SPREAD))

  return {
    type: 'heart-rate',
    value: Math.min(MAX, Math.max(MIN, bpm)),
    unit: 'bpm',
    timestamp: new Date().toISOString()
  }
}

module.exports = { generateReading }
