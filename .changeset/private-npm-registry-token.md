---
'@nocobase/agent-protocol': minor
'@nocobase/app-plugin-agents': minor
'@nocobase/agent-runner': minor
---

A runner asks the application for the token of NocoBase's private npm registry (`https://pkg-v3.nocobase.com/`) only when an install of a run needs it: when the repository's committed `.npmrc` points a scope or the registry at it, or after an `@nocobase/*` package was not found on the default registry, which it then retries once with the private registry. The token goes into a run-private npm configuration for that one command and is redacted from what the run reports. The machine's own npm and pnpm settings stay in effect except those pointing at the private registry, so a project that needs no private package never reaches it. Protocol version 16 adds the `npmCredentials` feature and `RUNNER_ROUTES.npmCredential`; applications register where the token comes from with `npmCredentialProviders`. Update the application before the runners.
