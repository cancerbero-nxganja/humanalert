# HumanAlert Quality Standards

## Non-negotiable rules for all code

### 1. Tests first
No feature ships without tests. Coverage must stay above 70%.
Emergency systems cannot have untested paths.

### 2. Offline-first
Every feature must work with intermittent or no internet.
Disasters destroy infrastructure. The tool must survive without connectivity.

### 3. Low-bandwidth
Target: full functionality on 2G (50kbps).
No heavy assets. Lazy loading everywhere. Compress everything.

### 4. Privacy by design
Missing persons data: minimum necessary information only.
No data stored beyond alert resolution.
GDPR, CCPA, LGPD compliant by default.

### 5. Multilingual
Every user-facing string must be in i18n.
No hardcoded text in any language.
RTL support for Arabic.

### 6. Accessibility
WCAG 2.1 AA minimum.
Works with screen readers.
High contrast mode.
Large text support.

### 7. Security
No credentials in code. Ever.
Input validation on all endpoints.
Rate limiting on all public APIs.
SQL injection protection.
XSS protection.

## Test commands
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:security
npm run test:a11y
npm run test:all (runs everything, must pass before any merge)
