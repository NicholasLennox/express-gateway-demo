# Gateway build - in-class steps

Starting point: `src/app.js` with `/health` and three hardcoded `proxy()` routes.

Order of the finished middleware chain:

```
request → logger → /health (public) → rate limit → API key → /v1 routes → service
```

- The logger goes first, so it sees every request, including the ones that get rejected.
- `/health` goes before the rate limit and the key. The health endpoint is how you find out what is running, so it stays open.
- The rate limit goes before the key, so nobody can guess keys as fast as they like.

---

## 1. Move the service URLs into `.env`

`gateway/.env`:

```
PORT=3000
SERVICE_NAME=gateway
ENVIRONMENT=development

HEART_RATE_URL=http://localhost:3001
TEMPERATURE_URL=http://localhost:3002
BLOOD_PRESSURE_URL=http://localhost:3003
```

`src/app.js`:

```js
app.use('/heart-rate', proxy(process.env.HEART_RATE_URL))
app.use('/temperature', proxy(process.env.TEMPERATURE_URL))
app.use('/blood-pressure', proxy(process.env.BLOOD_PRESSURE_URL))
```

Demo: change a port in a service's `.env` and in the gateway's `.env`. No code changes.

---

## 2. Logging middleware

One line per request, written when the response finishes, so the status code and duration are known. Proxied requests are logged too.

```js
app.use((req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
      `host=${req.get('host')} ip=${req.ip} ` +
      `status=${res.statusCode} ${Date.now() - start}ms`
    )
  })

  next()
})
```

Sample output:

```
[2026-10-01T09:12:44.103Z] GET /heart-rate/reading host=localhost:3000 ip=::1 status=200 14ms
```

- `req.originalUrl` and not `req.url`: inside a mounted route, `req.url` has already had the mount path stripped.
- Placement: the logger goes at the very top of `app.js`, above `/health`.

---

## 3. Rate limit

```bash
npm install express-rate-limit
```

```js
const rateLimit = require('express-rate-limit')

// Deliberately low, so it can be hit by hand in class.
const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, try again in a minute' }
})

app.use(limiter)
```

- Placement: below `/health`, above the proxy routes.
- Values: 5 requests per minute is easy to hit by refreshing the browser or pressing up and enter in curl a few times.
- The sixth request gets `429 Too Many Requests`. Show the `RateLimit` and `RateLimit-Policy` response headers with `curl -i`.

Hit it quickly:

```bash
for i in $(seq 1 8); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/heart-rate/reading; done
```

The loop prints `200` five times, then `429`. The logger shows the 429s too.

---

## 4. API key

`gateway/.env`:

```
API_KEY=bed2-demo-key
```

```js
const API_KEY = process.env.API_KEY

app.use((req, res, next) => {
  if (req.get('x-api-key') !== API_KEY) {
    return res.status(401).json({ error: 'Missing or invalid API key' })
  }

  next()
})
```

- Placement: below the rate limit, above the proxy routes.
- Only the gateway checks the key. The services never see it. This is one of the points of having a gateway.

Try it:

```bash
curl -i http://localhost:3000/heart-rate/reading                               # 401
curl -i -H "x-api-key: bed2-demo-key" http://localhost:3000/heart-rate/reading # 200
curl -i http://localhost:3000/health                                           # 200, no key needed
```

Postman: Headers tab, key `x-api-key`.

- Caveat to say out loud: a key in `.env` compared as a plain string is fine for a demo. It is not how real keys are stored or checked.
- Gotcha: if `API_KEY` is missing from `.env`, `API_KEY` is `undefined`, and a request with no header also sends `undefined`, so it gets through. Either demo this deliberately, or add `if (!API_KEY)` and fail on startup.

---

## 5. Version the routes: `/v1`

Move the proxy routes onto a router and mount it under `/v1`:

```js
const v1 = express.Router()

v1.use('/heart-rate', proxy(process.env.HEART_RATE_URL))
v1.use('/temperature', proxy(process.env.TEMPERATURE_URL))
v1.use('/blood-pressure', proxy(process.env.BLOOD_PRESSURE_URL))

app.use('/v1', v1)
```

- `GET /v1/heart-rate/reading` still reaches the service as `GET /reading`. Both mount paths are stripped. The services don't change.
- The point to make: when a v2 exists, add `app.use('/v2', v2)` pointing at the new services. Clients move over one at a time, and `/v1` is removed when nobody calls it any more. The logger shows who is still on v1.
- Keep `/health` unversioned. It describes the gateway, not the API.

Updated curl:

```bash
curl -H "x-api-key: bed2-demo-key" http://localhost:3000/v1/heart-rate/reading
```

---

## Skipped: CORS

There is no browser front end yet. curl and Postman don't enforce CORS, so there is nothing to show. It comes back when a front end calls the gateway.

---

## Finished `src/app.js`

```js
require('dotenv').config()

const express = require('express')
const proxy = require('express-http-proxy')
const rateLimit = require('express-rate-limit')

const app = express()

const SERVICE_NAME = process.env.SERVICE_NAME || 'gateway'
const ENVIRONMENT = process.env.ENVIRONMENT || 'default'
const API_KEY = process.env.API_KEY

// Logging
app.use((req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
      `host=${req.get('host')} ip=${req.ip} ` +
      `status=${res.statusCode} ${Date.now() - start}ms`
    )
  })

  next()
})

// Health - public, no rate limit, no key
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: SERVICE_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT
  })
})

// Rate limit
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, try again in a minute' }
}))

// API key
app.use((req, res, next) => {
  if (req.get('x-api-key') !== API_KEY) {
    return res.status(401).json({ error: 'Missing or invalid API key' })
  }

  next()
})

// v1 routes
const v1 = express.Router()

v1.use('/heart-rate', proxy(process.env.HEART_RATE_URL))
v1.use('/temperature', proxy(process.env.TEMPERATURE_URL))
v1.use('/blood-pressure', proxy(process.env.BLOOD_PRESSURE_URL))

app.use('/v1', v1)

module.exports = app
```
