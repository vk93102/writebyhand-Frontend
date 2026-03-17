# WriteByHand Frontend

## Docker

- Docker image config: [Dockerfile](Dockerfile)
- Compose config: [docker-compose.yml](docker-compose.yml)
- Nginx SPA config: [docker/nginx.conf](docker/nginx.conf)

Build and run locally:

- `npm run docker:build`
- `npm run docker:run`

or

- `docker compose up --build`

App will be available on `http://localhost:8080`.

## E2E Test Scripts

- [tests/ask.sh](tests/ask.sh): Ask Question search + AI endpoint checks
- [tests/payment.sh](tests/payment.sh): Subscription/payment endpoint checks
- [tests/Daily_submit.sh](tests/Daily_submit.sh): Daily quiz authenticated submit flow
- [tests/run_all.sh](tests/run_all.sh): Run all test scripts

Environment variables used by scripts:

- `BASE_URL` (default: `https://ed-tech-backend-tzn8.onrender.com`)
- `AUTH_TOKEN` (required for daily quiz authenticated flow)
- `USER_ID` (required for full payment/subscription user flow)
- `LANGUAGE` (default: `english`)

## CI/CD Pipelines

- CI: [.github/workflows/ci.yml](.github/workflows/ci.yml)
	- Installs dependencies
	- Builds web output
	- Runs all E2E shell scripts
	- Builds Docker image

- CD: [.github/workflows/cd.yml](.github/workflows/cd.yml)
	- Triggers on successful CI on `main`
	- Rebuilds web bundle
	- Calls deployment hook

Recommended GitHub Secrets:

- `E2E_BASE_URL`
- `E2E_AUTH_TOKEN`
- `E2E_USER_ID`
- `DEPLOY_HOOK_URL`
