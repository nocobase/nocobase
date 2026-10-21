---
'@nocobase/db': minor
'@nocobase/app-server': minor
'@nocobase/app-plugin-agents': minor
---

Expose pre-migration fresh-install state to transactional seeds and add an installation-only skill helper. Applications can create missing editable library skills and initialize global defaults on new databases without overwriting existing skills, version histories, files or attachments. The helper supports SKILL.md-only bundles and writes through the caller's seed transaction without resolving runtime services.
