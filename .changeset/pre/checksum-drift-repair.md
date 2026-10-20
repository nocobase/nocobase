---
"@nocobase/db": minor
"@nocobase/app-server": minor
"@nocobase/app-cli": minor
"@nocobase/app-skills": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Report migration and seed checksum drift as a warning instead of failing, and add `nocobase app db repair` to realign the recorded history.

An executed migration or seed whose source has since changed no longer stops the run. `latest()`, `rollback()` and `run()` return the drift in a new `warnings` field, the CLI prints it, `--json` carries it, and startup logs it through the application logger. Set `onChecksumMismatch: 'error'` on a connection's `migrations` or `seeds` configuration, or at the top level, to keep refusing to run. A history record whose migration is missing from the sources entirely still fails regardless of the policy.

`pnpm db:repair` rewrites recorded checksums to match the current sources, covering both migrations and seeds in one command. It previews before writing, prompts for confirmation unless `--force` is passed, supports `--dry-run` for inspection in CI, and conditions every write on the checksum it read, so a history changed in between fails rather than being overwritten. It never deletes a history record, so a repair cannot make an executed task run again.
