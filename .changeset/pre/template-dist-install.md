---
'@nocobase/app-template-default': minor
---

Install the deployable `dist/` with pnpm rather than npm, and add the database driver the application declares to `dist/package.json`. The driver was missing from that manifest, so a deployment installed no driver at all and failed on its first query.
