---
"@nocobase/app-cli-client": patch
---

Restart running ACP services after CLI updates and tolerate newer Skill registry formats without rewriting them.

When upgrading from a CLI version without this fix through `<bin> update`, run `<bin> acp service restart` once after the upgrade to restart the existing background connections.
