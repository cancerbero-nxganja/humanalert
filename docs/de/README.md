# HumanAlert — Schnellstartanleitung für Institutionen

> **5 Minuten bis zu Ihrem ersten Alarm.**

HumanAlert ist Open Source, für immer kostenlos, und 100% der Einnahmen werden an humanitäre Zwecke gespendet.

---

## Voraussetzungen

| Anforderung | Details |
|---|---|
| Verbindung | Mindestens 2G / 128 kbps |
| Browser | Jeder moderne Browser |
| Admin-JWT | Ausgestellt von Ihrem HumanAlert-Administrator |

---

## Schritt 1 — Dienst überprüfen (30 Sekunden)

```
GET https://<ihre-domain>/api/v1/health
```

Erwartete Antwort: `{ "status": "ok" }`

---

## Schritt 2 — Admin-Token erhalten (1 Minute)

Bitten Sie Ihren HumanAlert-Administrator, ein JWT zu generieren. Standardmäßig läuft es nach 24 Stunden ab.

---

## Schritt 3 — Ersten Alarm senden (2 Minuten)

```bash
curl -X POST https://<ihre-domain>/api/v1/alerts \
  -H "Authorization: Bearer <ihr-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "emergency",
    "severity": "high",
    "title": "Evakuierungshinweis",
    "description": "Bewohner der Zone A müssen sofort evakuieren.",
    "location": { "lat": 52.5200, "lon": 13.4050 },
    "radius_km": 5,
    "language": "de"
  }'
```

---

## Schritt 4 — Vermisste Person melden (1 Minute)

Verwenden Sie `POST /api/v1/missing-persons`. Mit `amber_alert: true` wird eine AMBER-Alarm-Echtzeitübertragung ausgelöst.

---

## Schritt 5 — Echtzeit-Updates über WebSocket (30 Sekunden)

```javascript
const ws = new WebSocket('wss://<ihre-domain>/ws');
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  console.log(type, data);
};
```

---

## Offline-Nutzung

Die HumanAlert-App funktioniert in 2G-Netzwerken. Aktionen werden offline in `localStorage` gespeichert und automatisch synchronisiert, wenn die Verbindung wiederhergestellt ist.

---

*HumanAlert — Technologie, damit Menschen menschlicher sein können.*
