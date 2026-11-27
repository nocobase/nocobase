---
'@nocobase/message-broker': minor
'@nocobase/app-skills': patch
---

Allow message broker adapters to set a subscription's default attempt limit. Explicit limits take precedence, and adapters without a default still use three attempts. Document how adapters handle final failures when a dead-letter destination is optional.
