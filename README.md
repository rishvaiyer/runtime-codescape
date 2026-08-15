# Runtime Codescape

Runtime Codescape is a portable developer-observability product that answers: which runtime path failed, which files and tests are implicated, and did the latest release get riskier? It combines synthetic OpenTelemetry-like spans with file ownership/coverage, test outcomes, and deployment facts.

## Run

```bash
npm test
npm run lint
npm start
open http://localhost:4180
```

`GET /api/analysis?release=v2.5.0` returns the bundled fixture. `POST /api/analyze` accepts a portable `{ "spans": [...], "metadata": {...}, "files": [...], "tests": [...] }` document. `GET /health` reports `backend: portable-json`.

## Algorithm

The importer validates unique IDs, parent references, cycles, and payload size. For each span, child time is subtracted from inclusive duration using interval-union arithmetic; the root-to-leaf chain with the greatest sum of exclusive durations is the critical path, avoiding nested double-counting. Risk combines failed-span penalty, critical-path latency, low coverage on changed files, and failed tests. Layout is deterministic by depth layer.

## Boundaries

Fixtures are synthetic and contain no customer traces, repository names, secrets, or personal data. A production adapter should authenticate collectors, redact attributes, enforce tenant boundaries, retain raw traces separately, and calibrate risk to service-level objectives.
