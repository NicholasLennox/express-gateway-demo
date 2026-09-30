# Health monitoring - class demo

Three small monitoring services and the gateway that sits in front of them. Each folder is its own Express project with its own `package.json` and `.env`.

| Folder | Port | Endpoints |
|---|---|---|
| `gateway/` | 3000 | `GET /health`, and `/heart-rate/*`, `/temperature/*`, `/blood-pressure/*` forwarded to the services |
| `heart-rate-service/` | 3001 | `GET /health`, `GET /reading` |
| `temperature-service/` | 3002 | `GET /health`, `GET /reading` |
| `blood-pressure-service/` | 3003 | `GET /health`, `GET /reading` |

The port and the service name come from each project's `.env`, not from the code.

There is no database yet. Every call to `/reading` generates a new, realistic value.

## Running it

Each project runs in its own terminal. For each folder:

```bash
cd heart-rate-service
npm install
npm run dev
```

`npm run dev` restarts the service when you save a file. `npm start` runs it without watching.

Then check a service is answering:

```bash
curl http://localhost:3001/reading
```

And that the gateway forwards to it:

```bash
curl http://localhost:3000/heart-rate/reading
```
