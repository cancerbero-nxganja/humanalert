# HumanAlert — 机构快速入门指南

> **5分钟发送您的第一条警报。**

HumanAlert 是开源软件，永久免费，所有收入100%捐赠给人道主义事业。

---

## 前提条件

| 要求 | 详情 |
|---|---|
| 网络连接 | 最低 2G / 128 kbps |
| 浏览器 | 任何现代浏览器 |
| 管理员 JWT | 由您的 HumanAlert 系统管理员颁发 |

---

## 步骤 1 — 验证服务（30秒）

```
GET https://<您的域名>/api/v1/health
```

预期响应：`{ "status": "ok" }`

---

## 步骤 2 — 获取管理员令牌（1分钟）

请联系 HumanAlert 管理员生成 JWT 令牌。默认24小时后过期。

---

## 步骤 3 — 发送您的第一条警报（2分钟）

```bash
curl -X POST https://<您的域名>/api/v1/alerts \
  -H "Authorization: Bearer <您的令牌>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "emergency",
    "severity": "high",
    "title": "疏散通知",
    "description": "A区居民必须立即疏散。",
    "location": { "lat": 39.9042, "lon": 116.4074 },
    "radius_km": 5,
    "language": "zh"
  }'
```

---

## 步骤 4 — 报告失踪人员（1分钟）

使用 `POST /api/v1/missing-persons`，设置 `amber_alert: true` 可触发实时 AMBER 警报广播。

---

## 步骤 5 — 通过 WebSocket 获取实时更新（30秒）

```javascript
const ws = new WebSocket('wss://<您的域名>/ws');
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  console.log(type, data);
};
```

---

## 离线使用

HumanAlert 应用可在 2G 网络上运行，断线时将操作保存到 `localStorage`，恢复连接后自动同步。

---

*HumanAlert — 让人类更有人情味的技术。*
