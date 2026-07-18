# Security policy

## Supported version

Security fixes are applied to the latest version on the default branch.

## Reporting a vulnerability

Do not open a public issue for a vulnerability. Use GitHub private vulnerability reporting from the repository Security tab and include:

- the affected component
- steps to reproduce
- the expected impact
- a suggested mitigation, when available

Please allow a reasonable period for investigation before public disclosure.

## Deployment model

OSINT Labs is designed as a local, single-operator laboratory. Docker binds the dashboard to `127.0.0.1` by default. Do not expose it directly to the internet.

The integrated terminal provides a shell inside the application container. If remote access is required, place the service behind HTTPS, strong authentication, network access controls and an audited reverse proxy.

Never commit `.env`, OpenRouter keys, exported investigations or the SQLite database.
