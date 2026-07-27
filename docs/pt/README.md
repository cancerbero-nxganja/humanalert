# HumanAlert — Guia de Início Rápido para Instituições

> **5 minutos para o seu primeiro alerta.**

HumanAlert é open source, gratuito para sempre, e 100% dos rendimentos são doados a causas humanitárias.

---

## Pré-requisitos

| Requisito | Detalhes |
|---|---|
| Conectividade | Mínimo 2G / 128 kbps |
| Navegador | Qualquer navegador moderno |
| JWT de administrador | Emitido pelo administrador do seu sistema HumanAlert |

---

## Passo 1 — Verificar o Serviço (30 segundos)

```
GET https://<seu-domínio>/api/v1/health
```

Resposta esperada: `{ "status": "ok" }`

---

## Passo 2 — Obter um Token de Administrador (1 minuto)

Solicite ao administrador HumanAlert que gere um JWT. Expira em 24 horas por padrão.

---

## Passo 3 — Enviar o seu Primeiro Alerta (2 minutos)

```bash
curl -X POST https://<seu-domínio>/api/v1/alerts \
  -H "Authorization: Bearer <seu-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "emergency",
    "severity": "high",
    "title": "Aviso de Evacuação",
    "description": "Os residentes da Zona A devem evacuar imediatamente.",
    "location": { "lat": -23.5505, "lon": -46.6333 },
    "radius_km": 5,
    "language": "pt"
  }'
```

---

## Passo 4 — Reportar uma Pessoa Desaparecida (1 minuto)

Use `POST /api/v1/missing-persons` com `amber_alert: true` para acionar a transmissão AMBER Alert em tempo real.

---

## Passo 5 — Atualizações em Tempo Real via WebSocket (30 segundos)

```javascript
const ws = new WebSocket('wss://<seu-domínio>/ws');
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  console.log(type, data);
};
```

---

## Uso Offline

O aplicativo funciona em redes 2G e armazena ações no `localStorage` sem conexão, sincronizando automaticamente ao recuperar a conectividade.

---

*HumanAlert — Tecnologia para que os humanos sejam mais humanos.*
