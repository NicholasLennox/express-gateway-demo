require('dotenv').config()

const app = require('./app')

const PORT = process.env.PORT || 3002
const SERVICE_NAME = process.env.SERVICE_NAME || 'temperature-service'

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`)
})
