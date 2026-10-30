---
"@nocobase/app-plugin-agents": patch
"@nocobase/app-plugin-knowledge": patch
"@nocobase/app-plugin-demo-mode": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

BREAKING: Agents 2 removes legacy vector collections, their SQLite/pgvector stores, workers and public types. Migrate consumers before upgrading; active `agents.vectors` settings now fail startup, while `{ store: false }` remains an inert compatibility setting for the 2.x line. Model services, Embedding, usage recording and Knowledge's independent indexing remain available. Historical migrations and existing data are retained. See `@nocobase/app-plugin-agents/docs/vectors-migration.md` for API/configuration migration, backups and rollback. Republish direct consumers against the new Agents major version.
