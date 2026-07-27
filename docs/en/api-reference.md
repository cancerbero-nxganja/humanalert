# HumanAlert API Reference

Base URL: `https://<your-domain>/api/v1`

All requests and responses use JSON. Date-times are ISO 8601 UTC.

---

## Authentication

Protected endpoints require a Bearer JWT in the `Authorization` header:

```
Authorization: Bearer <admin-jwt>
```

JWT payload:
```json
{ "sub": "admin-user-id", "role": "admin" }
```

Endpoints without `[JWT]` are public.

---

## Health

### GET /health

Returns service status. No authentication required.

**Response 200**
```json
{
  "status": "ok",
  "timestamp": "2026-07-27T00:00:00.000Z"
}
```

---

## Feedback API

The Feedback API collects user experience signals from any integration. All data feeds the public roadmap. No credentials required for submission.

### POST /feedback

Submit feedback. Rate limit: **10 requests per minute per IP**.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `source` | `"app" \| "web" \| "landing"` | ✓ | Where the feedback originated |
| `context` | `string` | ✓ | Page or action (e.g. `"alert_sent"`, `"home_page"`) |
| `rating` | `1–5 \| "thumbs-up" \| "thumbs-down"` | ✓ | Satisfaction score |
| `message` | `string` | — | Optional free-text comment |
| `email` | `string (email)` | — | Optional contact, stored hashed |
| `language` | `string` | ✓ | BCP-47 language code (e.g. `"en"`, `"es"`, `"ar"`) |

**Example request**
```bash
curl -X POST https://<your-domain>/api/v1/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "source": "app",
    "context": "alert_sent",
    "rating": "thumbs-up",
    "language": "es"
  }'
```

**Response 201** — Feedback recorded
```json
{
  "id": "a3f2c1d0-...",
  "source": "app",
  "context": "alert_sent",
  "rating": "thumbs-up",
  "message": null,
  "email": null,
  "language": "es",
  "created_at": "2026-07-27T12:00:00.000Z"
}
```

**Response 400** — Validation error
```json
{
  "error": "Validation failed",
  "details": { "fieldErrors": { "rating": ["Invalid rating value"] }, "formErrors": [] }
}
```

**Response 429** — Rate limit exceeded
```json
{ "error": "Too many requests, please try again later." }
```

---

### GET /feedback `[JWT]`

Returns up to 100 most recent feedback entries, newest first. Requires admin JWT.

**Response 200**
```json
[
  {
    "id": "a3f2c1d0-...",
    "source": "web",
    "context": "map_view",
    "rating": "5",
    "message": "Works great offline!",
    "email": null,
    "language": "pt",
    "created_at": "2026-07-27T11:55:00.000Z"
  }
]
```

**Response 401** — Missing or invalid token  
**Response 403** — Token lacks `admin` role

---

### Integrating the FeedbackWidget (external apps)

The reusable `FeedbackWidget` component can be embedded in any web or mobile app. It appears after user actions, requires at most 2 clicks (quick rating + optional text), and queues submissions in `localStorage` when offline.

**Installation**
```bash
# Copy packages/web/src/components/FeedbackWidget.tsx into your project
# Requires: react, @humanalert/api endpoint
```

**Usage**
```tsx
import { FeedbackWidget } from './FeedbackWidget';

function AlertSentPage() {
  return (
    <div>
      <h1>Alert sent successfully</h1>
      <FeedbackWidget
        context="alert_sent"
        language="en"
        onComplete={() => console.log('Feedback submitted')}
      />
    </div>
  );
}
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `context` | `string` | required | Identifies the user action |
| `language` | `string` | `"en"` | UI language (8 supported) |
| `onComplete` | `() => void` | — | Called after submission |
| `className` | `string` | `""` | Custom CSS class |

Supported languages: `en`, `es`, `fr`, `ar`, `pt`, `de`, `zh`, `hi`.

---

## Alerts

### POST /alerts `[JWT]`

Create a new alert and broadcast it via WebSocket (`alert:new`).

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | ✓ | Alert type (e.g. `"emergency"`, `"weather"`, `"health"`) |
| `severity` | `"low" \| "medium" \| "high" \| "critical"` | ✓ | Urgency level |
| `title` | `string` | ✓ | Short title (max 200 chars) |
| `description` | `string` | ✓ | Full description |
| `location` | `{ lat: number, lon: number }` | ✓ | Epicenter |
| `radius_km` | `number` | ✓ | Affected radius |
| `language` | `string` | ✓ | BCP-47 code |
| `expires_at` | `ISO datetime` | — | Auto-expire time |

**Response 201** — Alert created and broadcast

### GET /alerts

List active alerts. No authentication.

**Query parameters**: `lat`, `lon`, `radius_km` (geo filter), `status` (default `active`)

**Response 200** — Array of alert objects

### GET /alerts/:id

Get a single alert by ID.

**Response 200** — Alert object  
**Response 404** — Not found

### PATCH /alerts/:id `[JWT]`

Update alert fields (title, description, status, severity).

### DELETE /alerts/:id `[JWT]`

Soft-delete (sets `status = "inactive"`).

---

## Missing Persons

### POST /missing-persons `[JWT]`

Create a missing person report. Privacy-first: last name is initial only; photo is stored as a hash reference, not the image itself.

**Key fields**: `first_name`, `last_name_initial`, `age_range_min`, `age_range_max`, `gender`, `last_seen_at`, `last_seen_location`, `contact_hash`, `amber_alert`, `language`

Set `amber_alert: true` to emit `missing_person:amber_alert` via WebSocket in addition to `missing_person:new`.

### GET /missing-persons

List missing persons. No auth.

**Query params**: `lat`, `lon`, `radius_km`, `status` (default `missing`), `amber_only`

### GET /missing-persons/:id

Get single report.

### PATCH /missing-persons/:id `[JWT]`

Update status (`missing` → `found` → `reunited`).

---

## Animal Alerts

Integrated with the PetWhisper / AlertaMascota ecosystem. Always free, no authentication required to submit.

### POST /animal-alerts

Submit a lost or found animal alert. Broadcast via WebSocket (`animal-alert:new`).

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `species` | `string` | ✓ | e.g. `"dog"`, `"cat"` |
| `name` | `string` | — | Animal's name |
| `photo_url` | `string (url)` | — | Public photo URL |
| `last_seen_lat` | `number` | ✓ | Latitude |
| `last_seen_lon` | `number` | ✓ | Longitude |
| `contact_hash` | `string` | ✓ | SHA-256 of contact info (privacy) |
| `status` | `"LOST" \| "FOUND" \| "REUNITED"` | ✓ | Current status |
| `description` | `string` | — | Additional details |
| `language` | `string` | ✓ | BCP-47 code |

**Response 201** — Alert created

### GET /animal-alerts

List animal alerts. No auth.

**Query params**: `lat`, `lon`, `radius_km`, `status` (default `LOST`)

### GET /animal-alerts/:id

Get single animal alert.

### PATCH /animal-alerts/:id

Update status (no auth — anyone who found the animal can update).

---

## Map Pins

Community-contributed geographic markers. No authentication for submission.

### POST /map-pins

Create a map pin.

**Request body**: `category`, `title`, `description`, `lat`, `lon`, `language`, `expires_at`

Categories: `shelter`, `food`, `water`, `medical`, `evacuation`, `hazard`, `information`

**Response 201** — Pin created, broadcast via WebSocket (`map-pin:new`)

### GET /map-pins

List pins. No auth.

**Query params**: `lat`, `lon`, `radius_km`, `category`, `include_animal_alerts` (boolean — overlays animal alerts on the map layer)

### GET /map-pins/:id

Get single pin.

### PATCH /map-pins/:id `[JWT]`

Update pin.

### DELETE /map-pins/:id `[JWT]`

Soft-delete pin.

---

## WebSocket Events

Connect to `wss://<your-domain>/ws`.

| Event type | Payload | Description |
|---|---|---|
| `alert:new` | Alert object | New alert created |
| `alert:updated` | Alert object | Alert modified |
| `missing_person:new` | MissingPerson object | New missing person report |
| `missing_person:amber_alert` | MissingPerson object | AMBER Alert issued |
| `missing_person:updated` | MissingPerson object | Status changed |
| `animal-alert:new` | AnimalAlert object | New animal alert |
| `animal-alert:updated` | AnimalAlert object | Status changed |
| `map-pin:new` | MapPin object | New map pin |
| `map-pin:updated` | MapPin object | Pin modified |

---

## Error Format

All errors return:
```json
{
  "error": "Human-readable error message",
  "details": { ... }
}
```

HTTP status codes: `400` validation, `401` missing auth, `403` insufficient role, `404` not found, `429` rate limited, `500` server error.

---

## Rate Limiting

| Endpoint | Limit |
|---|---|
| `POST /feedback` | 10 req/min per IP |
| All others | 100 req/min per IP (global) |

---

*HumanAlert API v1 — OpenStreetMap only, privacy by design, offline-first.*
