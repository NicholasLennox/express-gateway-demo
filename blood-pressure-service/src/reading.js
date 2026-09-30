// Normal adult blood pressure is around 120/80 mmHg. Readings cluster around the
// average, with the occasional one further out, the way a real monitor would.
const SYSTOLIC_AVERAGE = 118
const SYSTOLIC_SPREAD = 10
const DIASTOLIC_AVERAGE = 77
const DIASTOLIC_SPREAD = 7

// A normally distributed random number (Box-Muller transform). Math.random()
// on its own gives every value in the range the same chance, which doesn't
// look like a real patient.
function randomNormal (average, spread) {
  const u = 1 - Math.random()
  const v = Math.random()

  return average + spread * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function generateReading () {
  const systolic = Math.round(randomNormal(SYSTOLIC_AVERAGE, SYSTOLIC_SPREAD))

  // The two numbers aren't independent: diastolic is always well below
  // systolic, so it is kept at least 25 mmHg under it.
  const diastolic = Math.min(
    systolic - 25,
    Math.round(randomNormal(DIASTOLIC_AVERAGE, DIASTOLIC_SPREAD))
  )

  return {
    type: 'blood-pressure',
    value: { systolic, diastolic },
    unit: 'mmHg',
    timestamp: new Date().toISOString()
  }
}

module.exports = { generateReading }
