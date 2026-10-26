---
"@nocobase/create-plugin": minor
"@nocobase/app-cli": patch
"@nocobase/app-skills": patch
---

Create plugins directly in an existing application's `packages/` workspace without a NocoBase source checkout. Resolve generated dependencies against the application's installed versions, preserve workspace settings, connect the local dependency, and report application edits and resolved dependencies in the JSON generation plan. Keep runtime registration explicit and preserve source-repository generation.

Support custom scoped `app-plugin-*` names in generation and plugin management. Keep package-manager progress on stderr so `create-plugin --json` always prints one result document. App-local generated plugins are private by default.
