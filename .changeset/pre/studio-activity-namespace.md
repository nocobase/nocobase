---
'@nocobase/studio': patch
---

A new migration, `202610220020_studio_rename_activity_namespace`, moves the i18n namespace of the owner notices workflows already recorded (`owner_notified` activities) from `studio` to `@nocobase/studio`, so the inbox and an issue's recent activity keep showing them translated.
