# Runtime Codescape

Runtime Codescape is a lightweight, synthetic developer-observability dashboard. It connects OpenTelemetry-like spans, git blame/change metadata, test coverage, ownership, and deployment context into one answer: **which runtime path failed, what files are implicated, and what changed between releases?**

## Run locally

```sh
npm test
npm start
# open http://localhost:4173
```

No dependencies, database, Docker, or external API is required. The browser UI is static and the Node server only serves local assets. The fixture is deliberately portable and synthetic; it is not a production telemetry collector.

## Algorithm

The trace graph is a fixed topology rendered from a small fixture. Critical-path scoring walks the parent/child span tree and adds each span duration to the maximum downstream branch. Risk evidence combines a deterministic file signal, owner, coverage, and release commit. This makes the demo repeatable and testable while leaving a clear seam for real OTLP/git adapters later.

## Privacy and security boundaries

- No credentials, cookies, source contents, production traces, or personal data are included.
- Do not point this static fixture at a private repository or live telemetry without adding authentication, access controls, retention policy, and redaction.
- Deployment metadata shown here is mock release context. A real collector should enforce tenant isolation and least privilege.

## Limitations

This is a front-end product slice, not a live ingest pipeline. It does not query GitHub, OpenTelemetry, CI, or Railway; the release comparison is a portable fixture. The next production step is a read-only adapter layer with sampled traces and server-side redaction.
