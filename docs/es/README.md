# HumanAlert — Guía de Inicio Rápido para Instituciones

> **5 minutos para tu primera alerta.**

HumanAlert es software libre, gratuito para siempre, y el 100% de los ingresos se dona a causas humanitarias.

---

## Requisitos Previos

| Requisito | Detalle |
|---|---|
| Conectividad | Mínimo 2G / 128 kbps |
| Navegador | Cualquier navegador moderno (Chrome, Firefox, Safari, Edge) |
| JWT de administrador | Emitido por el administrador de tu sistema HumanAlert |

---

## Paso 1 — Verificar el Servicio (30 segundos)

```
GET https://<tu-dominio>/api/v1/health
```

Respuesta esperada:

```json
{ "status": "ok", "timestamp": "2026-07-27T00:00:00.000Z" }
```

---

## Paso 2 — Obtener un Token de Administrador (1 minuto)

Solicita a tu administrador HumanAlert que genere un JWT. El token tiene esta forma:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Guárdalo en un lugar seguro. Expira en 24 horas por defecto.

---

## Paso 3 — Enviar tu Primera Alerta (2 minutos)

```bash
curl -X POST https://<tu-dominio>/api/v1/alerts \
  -H "Authorization: Bearer <tu-token-admin>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "emergency",
    "severity": "high",
    "title": "Aviso de Evacuación",
    "description": "Los residentes de la Zona A deben evacuar de inmediato.",
    "location": { "lat": -34.6037, "lon": -58.3816 },
    "radius_km": 5,
    "language": "es"
  }'
```

Una respuesta `201 Created` confirma que la alerta fue enviada y transmitida en tiempo real a todos los clientes conectados.

---

## Paso 4 — Reportar una Persona Desaparecida (1 minuto)

```bash
curl -X POST https://<tu-dominio>/api/v1/missing-persons \
  -H "Authorization: Bearer <tu-token-admin>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "María",
    "last_name_initial": "G",
    "age_range_min": 8,
    "age_range_max": 10,
    "gender": "female",
    "last_seen_at": "2026-07-27T10:30:00Z",
    "last_seen_location": { "lat": -34.6037, "lon": -58.3816, "description": "Entrada del Parque Central" },
    "contact_hash": "sha256-del-contacto",
    "amber_alert": true,
    "language": "es"
  }'
```

Con `amber_alert: true` se activa la difusión AMBER Alert en tiempo real.

---

## Paso 5 — Actualizaciones en Tiempo Real vía WebSocket (30 segundos)

```javascript
const ws = new WebSocket('wss://<tu-dominio>/ws');

ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  console.log('Evento recibido:', type, data);
};
```

Eventos: `alert:new`, `alert:updated`, `missing_person:new`, `missing_person:amber_alert`, `animal-alert:new`, `map-pin:new`.

---

## Uso sin Conexión

La app web de HumanAlert usa **service workers** para funcionar sin internet. Las acciones se guardan en `localStorage` y se sincronizan automáticamente al recuperar la conexión.

---

## Ayuda

- **Referencia API**: [docs/es/api-reference.md](./api-reference.md)
- **Manifiesto**: [docs/es/mission.md](./mission.md)
- **GitHub Issues**: https://github.com/cancerbero-nxganja/humanalert/issues

---

*HumanAlert — Tecnología para que los humanos sean más humanos.*
