# Contributing to HumanAlert

Thank you. Every contribution helps save lives.

## Philosophy
- Code quality over speed. A bug in an emergency system is not acceptable.
- Test everything. If it is not tested, it does not exist.
- Document everything. A tool nobody can use helps nobody.

## How to contribute

### Reporting bugs
Open an issue with: steps to reproduce, expected vs actual behavior, environment details.

### Adding a language
1. Copy docs/en/ to docs/YOUR_LANG/
2. Translate all files
3. Add your language to packages/shared/i18n/languages.ts
4. Open a PR

### Adding a feature
1. Open an issue first — discuss before building
2. Fork the repo
3. Create a branch: feature/your-feature-name
4. Write tests FIRST (TDD)
5. Implement the feature
6. Ensure all tests pass: npm test
7. Update documentation
8. Open a PR

## Quality gates (mandatory)
All PRs must pass:
- Unit tests (coverage must not decrease)
- Integration tests
- Security scan (npm audit)
- Accessibility check
- Documentation updated

## Code of conduct
This project serves vulnerable populations. Be respectful, inclusive, and responsible.

## For institutions
If you are a government, NGO, or emergency services organization deploying HumanAlert:
- You are free to use, modify, and deploy without restrictions
- We welcome feedback on what works and what does not in real deployments
- Open an issue tagged "institutional-feedback"

## Disclaimer
Contributors are not responsible for deployment outcomes or use of this software.
