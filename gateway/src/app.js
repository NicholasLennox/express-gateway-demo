require('dotenv').config()

const express = require('express')
const proxy = require('express-http-proxy')

const app = express()

const SERVICE_NAME = process.env.SERVICE_NAME || 'gateway'
const ENVIRONMENT = process.env.ENVIRONMENT || 'default'

// Health endpoint for the gateway itself. It says the gateway is up, not that
// the services behind it are.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: SERVICE_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT
  })
})

// One route per service. The mount path is stripped before the request is
// forwarded, so GET /heart-rate/reading reaches the heart-rate service as
// GET /reading.
app.use('/heart-rate', proxy('http://localhost:3001'))
app.use('/temperature', proxy('http://localhost:3002'))
app.use('/blood-pressure', proxy('http://localhost:3003'))

module.exports = app
