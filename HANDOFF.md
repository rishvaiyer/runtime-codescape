# Runtime Codescape handoff

## Demo path

1. Open the dashboard and show `GET /checkout`.
2. Follow the highlighted critical path through `payments.authorize` to `ledger.append`.
3. Show the failed span, timeout reason, owner, 61% coverage, and failed contract test.
4. Switch releases to show latency, risk, coverage, and failed-test deltas.
5. POST a portable trace to `/api/analyze` to show the importer is not hard-coded to the fixture.

## Verification

- `npm test` — five deterministic analyzer/import tests.
- `npm run lint` — syntax checks for server, analyzer, and client.
- Smoke routes: `/health`, `/api/analysis?release=v2.5.0`, `POST /api/analyze`, and `/`.
- Browser UI smoke: trace graph, stable-release switch, incident details, and no console errors.

## Deployment

Deploy with `railway up --new --name runtime-codescape`; create a Railway service domain targeting the runtime `PORT`. No paid services or database are required.

## Known limitations

The bundled adapter is portable JSON, not a live collector or vendor integration. Production work should add authenticated OTLP ingestion, redaction, durable retention, tenant isolation, and calibrated SLOs.
