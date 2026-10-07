# Release management database

One creation migration, `202610020001_rel_create_tables`, holds the whole schema. Every table is prefixed `rel`:

- `relEnvironments`: deployment targets — the driver, its settings, encrypted write-only credentials, the public URL rule, protection and approval settings and a limit of Apps.
- `relApps`: Apps, each in one environment, with labels and a runtime policy (activation, idle stop, dormancy). Only an explicit removal deletes one.
- `relReleases`, `relReleaseChecksums`, `relUploadRequests`: immutable uploaded or promoted builds, deduplicated per App by checksum and made idempotent by request key.
- `relDeployments`, `relDeployRequests`: deploy and rollback history with phases, outcomes and actors, and the idempotency keys of deploy calls.
- `relDeploymentRequests`: deployments proposed on environments that require approval.
- `relUploadTickets`: one-time upload tickets, stored as hashes.

Runtime state is not stored: the driver reports what runs. After the plugin's first release, schema changes are new migrations; the creation migration is not edited.
