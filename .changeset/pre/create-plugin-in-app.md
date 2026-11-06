---
"@nocobase/create-plugin": minor
"@nocobase/app-cli": patch
"@nocobase/app-skills": patch
---

Create plugins directly in an existing application's `packages/` workspace without a NocoBase source checkout. Resolve generated dependencies against the application's installed versions, preserve workspace settings, connect the local dependency, and report application edits and resolved dependencies in the JSON generation plan. Keep runtime registration explicit and preserve source-repository generation.

Support custom scoped `app-plugin-*` names in generation and plugin management. Keep package-manager progress on stderr so `create-plugin --json` always prints one result document. App-local generated plugins are private by default.

Preserve application configuration during failed plugin generation with staged atomic replacements and rollback backups. Reject plugin names already declared as optional dependencies and resolve runtime-provided dependencies through pnpm symlinks.

Keep generated plugins and committed application configuration when temporary-file cleanup fails, report remaining directories on stderr, and preserve the original error if generation already failed.
