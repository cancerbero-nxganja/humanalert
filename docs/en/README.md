# HumanAlert — Institution Quick-Start Guide

> **5 minutes to your first alert.**

HumanAlert is open-source, free forever, 100% of proceeds donated to humanitarian causes.

---

## Prerequisites

| Requirement | Details |
|---|---|
| Connectivity | 2G / 128 kbps minimum |
| Browser | Any modern browser (Chrome, Firefox, Safari, Edge) |
| Admin JWT | Issued by your HumanAlert system administrator |

---

## Step 1 — Health Check (30 seconds)

Verify your deployment is running:

```
GET https://<your-domain>/api/v1/health
```

Expected response:

```json
{ "status": "ok", "timestamp": "2026-07-27T00:00:00.000Z" }
```

---

## Step 2 — Obtain an Admin Token (1 minute)

Contact your HumanAlert administrator to generate a JWT. The token looks like:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Store it securely. It expires after 24 hours by default.

---

## Step 3 — Send Your First Alert (2 minutes)

```bash
curl -X POST https://<your-domain>/api/v1/alerts \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "emergency",
    "severity": "high",
    "title": "Evacuation Notice",
    "description": "Residents of Zone A must evacuate immediately.",
    "location": { "lat": -34.6037, "lon": -58.3816 },
    "radius_km": 5,
    "language": "en"
  }'
```

A `201 Created` response confirms the alert was sent and broadcast to all connected clients via WebSocket.

---

## Step 4 — Report a Missing Person (1 minute)

```bash
curl -X POST https://<your-domain>/api/v1/missing-persons \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Maria",
    "last_name_initial": "G",
    "age_range_min": 8,
    "age_range_max": 10,
    "gender": "female",
    "last_seen_at": "2026-07-27T10:30:00Z",
    "last_seen_location": { "lat": -34.6037, "lon": -58.3816, "description": "Central Park entrance" },
    "contact_hash": "sha256-of-contact-info",
    "amber_alert": true,
    "language": "en"
  }'
```

Set `amber_alert: true` to trigger AMBER Alert broadcast via WebSocket event `missing_person:amber_alert`.

---

## Step 5 — Real-Time Updates via WebSocket (30 seconds)

Connect to the WebSocket endpoint to receive live events:

```javascript
const ws = new WebSocket('wss://<your-domain>/ws');

ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  console.log('Received event:', type, data);
};
```

Events emitted: `alert:new`, `alert:updated`, `missing_person:new`, `missing_person:amber_alert`, `animal-alert:new`, `map-pin:new`.

---

## Offline Usage

The HumanAlert web app uses **service workers** to cache all resources. It works on 2G networks and stores actions in `localStorage` when offline, syncing automatically when connectivity is restored.

---

## Getting Help

- **API Reference**: [docs/en/api-reference.md](./api-reference.md)
- **Mission & Values**: [docs/en/mission.md](./mission.md)
- **GitHub Issues**: https://github.com/cancerbero-nxganja/humanalert/issues

---

*HumanAlert — Technology so humans can be more human.*
