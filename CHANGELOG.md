# Changelog

All notable changes to HumanAlert are documented here.

## [Unreleased]

## [0.7.0] — 2026-07-27

### Added
- FASE 7 DOCS: Institution quick-start manual in 8 languages (en, es, fr, ar, pt, zh, hi, de)
- FASE 7 DOCS: API Reference with comprehensive Feedback API section for external integrations
- FASE 7 DOCS: Mission manifesto in 8 languages
- CHANGELOG

### Coverage
- API: 83.38% statements, 76.02% branches, 94.44% functions, 92.74% lines
- Web: 98.79% statements, 77.77% branches, 100% functions, 99.36% lines

## [0.6.0] — 2026-07-26

### Added
- FASE 6 WEB FRONTEND: Next.js SSR web application
- FeedbackWidget component (max 2 clicks, offline queue, 8 languages, RTL Arabic)
- Service workers for offline-first operation
- WCAG 2.1 AA accessibility (SkipLink, semantic HTML, ARIA)
- i18n support for 8 languages
- MapView with OpenStreetMap (react-leaflet), animal alerts overlay layer
- OfflineBanner for connectivity status
- LanguageSwitcher component

## [0.5.0] — 2026-07-25

### Added
- FASE 5 MAPA-SOLIDARIO: MapPin CRUD API
- GET /api/v1/map-pins with geo filter and `include_animal_alerts` overlay parameter
- WebSocket broadcast for map pin events
- Categories: shelter, food, water, medical, evacuation, hazard, information

## [0.4.0] — 2026-07-24

### Added
- FASE 4 ANIMAL-ALERT: Animal alert CRUD API integrated with PetWhisper/AlertaMascota
- POST /api/v1/animal-alerts (no auth, always free)
- GET /api/v1/animal-alerts with geo filter (lat/lon/radius_km)
- Status lifecycle: LOST → FOUND → REUNITED
- WebSocket broadcast for animal alert events
- Privacy: contact stored as hash, not raw data

## [0.3.0] — 2026-07-23

### Added
- FASE 3 BUSCA-VIDA: Missing persons CRUD API
- AMBER Alert support (amber_alert field, dedicated WebSocket event)
- Privacy-first: last name initial only, photo as hash reference
- GET /api/v1/missing-persons with amber_only filter

## [0.2.0] — 2026-07-22

### Added
- FASE 2 ALERT-RED: Alert CRUD API
- WebSocket broadcast server
- Offline queue support
- Geo-radius filtering with Haversine formula

## [0.1.0] — 2026-07-21

### Added
- FASE 1 FOUNDATION: TypeScript types (Alert, MissingPerson, MapPin, AnimalAlert, Feedback)
- GET /api/v1/health
- POST /api/v1/feedback (no auth, rate limit 10/min)
- GET /api/v1/feedback (JWT admin)
- PostgreSQL migrations for all entities
- JWT middleware (requireAdmin)
- Zod validation
- Global rate limiting
