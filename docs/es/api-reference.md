# HumanAlert — Referencia de API

URL base: `https://<tu-dominio>/api/v1`

Todas las solicitudes y respuestas usan JSON. Las fechas son ISO 8601 UTC.

---

## Autenticación

Los endpoints protegidos requieren un JWT Bearer en el encabezado `Authorization`:

```
Authorization: Bearer <jwt-admin>
```

Los endpoints sin `[JWT]` son públicos.

---

## Salud

### GET /health

Devuelve el estado del servicio. Sin autenticación.

**Respuesta 200**
```json
{ "status": "ok", "timestamp": "2026-07-27T00:00:00.000Z" }
```

---

## API de Feedback

La API de Feedback recopila señales de experiencia de usuario desde cualquier integración. No requiere credenciales para enviar.

### POST /feedback

Envía feedback. Límite: **10 solicitudes por minuto por IP**.

**Cuerpo de solicitud**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `source` | `"app" \| "web" \| "landing"` | ✓ | Origen del feedback |
| `context` | `string` | ✓ | Página o acción (ej. `"alert_sent"`) |
| `rating` | `1–5 \| "thumbs-up" \| "thumbs-down"` | ✓ | Puntuación |
| `message` | `string` | — | Comentario opcional |
| `email` | `string (email)` | — | Contacto opcional |
| `language` | `string` | ✓ | Código BCP-47 (ej. `"es"`) |

**Respuesta 201** — Feedback registrado  
**Respuesta 400** — Error de validación  
**Respuesta 429** — Límite de velocidad superado

### GET /feedback `[JWT]`

Devuelve hasta 100 entradas de feedback recientes. Requiere JWT de administrador.

**Respuesta 200** — Array de objetos de feedback  
**Respuesta 401** — Token faltante o inválido  
**Respuesta 403** — El token no tiene rol `admin`

---

## Alertas

### POST /alerts `[JWT]`

Crea una alerta y la transmite por WebSocket (`alert:new`).

**Campos clave**: `type`, `severity`, `title`, `description`, `location` (lat/lon), `radius_km`, `language`, `expires_at`

### GET /alerts

Lista alertas activas. Sin autenticación.

**Parámetros**: `lat`, `lon`, `radius_km`, `status` (por defecto `active`)

### GET /alerts/:id · PATCH /alerts/:id `[JWT]` · DELETE /alerts/:id `[JWT]`

---

## Personas Desaparecidas

### POST /missing-persons `[JWT]`

Privacidad por diseño: solo inicial del apellido, foto como hash.

`amber_alert: true` emite `missing_person:amber_alert` por WebSocket.

### GET /missing-persons · GET /missing-persons/:id · PATCH /missing-persons/:id `[JWT]`

---

## Alertas de Animales

Integración con PetWhisper / AlertaMascota. Siempre gratuito, sin autenticación para enviar.

### POST /animal-alerts

`status`: `"LOST"` | `"FOUND"` | `"REUNITED"`

### GET /animal-alerts?lat=&lon=&radius_km= · GET /animal-alerts/:id · PATCH /animal-alerts/:id

---

## Pines de Mapa

Contribuciones comunitarias. Sin autenticación para crear.

### POST /map-pins · GET /map-pins · GET /map-pins/:id · PATCH /map-pins/:id `[JWT]` · DELETE /map-pins/:id `[JWT]`

**Parámetro especial GET**: `include_animal_alerts=true` superpone alertas de animales en la capa del mapa.

---

## Eventos WebSocket

Conectar a `wss://<tu-dominio>/ws`

| Evento | Descripción |
|---|---|
| `alert:new` | Nueva alerta creada |
| `alert:updated` | Alerta modificada |
| `missing_person:new` | Nuevo reporte de persona desaparecida |
| `missing_person:amber_alert` | Alerta AMBER emitida |
| `animal-alert:new` | Nueva alerta de animal |
| `map-pin:new` | Nuevo pin de mapa |

---

## Límites de Velocidad

| Endpoint | Límite |
|---|---|
| `POST /feedback` | 10 req/min por IP |
| Todos los demás | 100 req/min por IP |

---

*HumanAlert API v1 — Solo OpenStreetMap, privacidad por diseño, offline-first.*
