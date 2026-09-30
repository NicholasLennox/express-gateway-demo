require('dotenv').config()

const express = require('express')

const { generateReading } = require('./reading')

const app = express()

const SERVICE_NAME = process.env.SERVICE_NAME || 'blood-pressure-service'
const ENVIRONMENT = process.env.ENVIRONMENT || 'default'

app.use(express.json())

// Health endpoint.
// `service` says which service answered. Once requests go through the gateway,
// that is how we tell the services apart.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: SERVICE_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT
  })
})

// The current blood-pressure reading. There is no database yet, so every request
// generates a new one.
app.get('/reading', (req, res) => {
  res.status(200).json(generateReading())
})

module.exports = app
