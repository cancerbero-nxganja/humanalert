# Changelog

All notable changes to HumanAlert are documented here.

## [Unreleased]

## [1.1.0] — 2026-08-13

### Security
- CORS origin restriction: `CORS_ORIGINS` env var (comma-separated) lets operators lock down allowed origins in production; defaults to `*` for development backward compatibility
- `app.ts` CORS logic fully tested: 5 new tests cover wildcard mode, restricted mode (allowed/blocked/no-origin), and explicit-wildcard mode

### Improved
- MEJORA CONTINUA cycle 12: security audit — configurable CORS origins
- API tests: +5 (CORS) → 150 total, zero failures
- `app.ts` branches: 100% (was part of untracked global gap; now explicitly verified)

### Coverage
- API: 100% statements, 99.44% branches, 100% functions, 100% lines
- Web: 100% statements, 98.41% branches, 100% functions, 100% lines (unchanged)
- Total tests: 228 (API: 150, Web: 78), zero failures

## [1.0.0] — 2026-08-04

### Improved
- MEJORA CONTINUA cycle 11: coverage improvement targeting remaining branch and function gaps
- API: +1 test — malformed WebSocket frame triggers server-side ws.on('error') handler; broadcast.ts now 100% functions (was 87.5%)
- Web: +2 tests — SSR guard branch in offlineQueue.ts (window undefined, via jest-environment node); navigator-undefined branch in useOnlineStatus.ts covered via Object.defineProperty; hooks and lib modules now 100% branch coverage
- Remaining accepted gaps: alerts.ts line 25 (req.user?.sub ?? null, defensive code behind requireAdmin guarantee); FeedbackWidget.tsx line 42 (SSR navigator guard in client-only component, untestable in jsdom without cross-test contamination)

### Coverage
- API: 100% statements, 99.41% branches, 100% functions, 100% lines (functions up from 97.22%)
- Web: 100% statements, 98.41% branches, 100% functions, 100% lines (branches up from 95.23%)
- Total tests: 223 (API: 145, Web: 78), zero failures

## [0.9.0] — 2026-07-30

### Improved
- MEJORA CONTINUA cycle 10: comprehensive coverage improvement across API and web packages
- API: +9 new tests covering 404 handler, JWT_SECRET missing (500 path), DB error paths for feedback POST/GET, animal-alerts GET/:id and PATCH/:id/status, alerts with expires_at field, animal-alerts description/language update fields
- Web: +13 new tests covering OfflineBanner default language + unknown language fallback, LanguageSwitcher undefined locale fallback, API params branches for getMissingPersons/getAnimalAlerts/getMapPins, NEXT_PUBLIC_API_URL env branch, offlineQueue malformed JSON, FeedbackWidget default props + className + offline+onComplete + empty message submit

### Coverage
- API: 99.83% statements, 99.41% branches, 97.22% functions, 100% lines (was 97.31%/97.66%/94.44%/97.90%)
- Web: 99.39% statements, 95.23% branches, 100% functions, 100% lines (was 98.79%/77.77%/100%/99.36%)
- Total tests: 220 (API: 144, Web: 76), zero failures

## [0.8.0] — 2026-07-29

### Improved
- MEJORA CONTINUA cycle 9: branch coverage improvement across API routes
- Added 6 new targeted tests for update field branches in alerts, missing-persons, and map-pins
- Covered geo+category filter branch in map-pins GET
- Covered POST missing-person without optional fields (physical_description, location.description)
- API tests: 135 passed (was 129), zero failures

### Coverage
- API: 97.31% statements, 97.66% branches, 94.44% functions, 97.90% lines (was 88.75%/79.53%)
- Web: 98.79% statements, 77.77% branches, 100% functions, 99.36% lines (unchanged)

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
