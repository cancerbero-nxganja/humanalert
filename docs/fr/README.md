# HumanAlert — Guide de Démarrage Rapide pour les Institutions

> **5 minutes pour votre première alerte.**

HumanAlert est open source, gratuit pour toujours, et 100% des revenus sont reversés à des causes humanitaires.

---

## Prérequis

| Exigence | Détail |
|---|---|
| Connectivité | 2G / 128 kbps minimum |
| Navigateur | Tout navigateur moderne |
| JWT Admin | Émis par votre administrateur HumanAlert |

---

## Étape 1 — Vérification du Service (30 secondes)

```
GET https://<votre-domaine>/api/v1/health
```

Réponse attendue: `{ "status": "ok" }`

---

## Étape 2 — Obtenir un Token Administrateur (1 minute)

Demandez à votre administrateur HumanAlert de générer un JWT Bearer. Il expire dans 24 heures.

---

## Étape 3 — Envoyer votre Première Alerte (2 minutes)

```bash
curl -X POST https://<votre-domaine>/api/v1/alerts \
  -H "Authorization: Bearer <votre-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "emergency",
    "severity": "high",
    "title": "Avis d évacuation",
    "description": "Les résidents de la Zone A doivent évacuer immédiatement.",
    "location": { "lat": 48.8566, "lon": 2.3522 },
    "radius_km": 5,
    "language": "fr"
  }'
```

---

## Étape 4 — Signaler une Personne Disparue (1 minute)

Utilisez `POST /api/v1/missing-persons` avec `amber_alert: true` pour déclencher une diffusion AMBER Alert en temps réel.

---

## Étape 5 — Mises à Jour en Temps Réel (30 secondes)

```javascript
const ws = new WebSocket('wss://<votre-domaine>/ws');
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  console.log(type, data);
};
```

---

## Utilisation Hors Ligne

L'application fonctionne sur les réseaux 2G et stocke les actions dans `localStorage` sans connexion, avec synchronisation automatique au retour de la connectivité.

---

*HumanAlert — La technologie pour que les humains soient plus humains.*
