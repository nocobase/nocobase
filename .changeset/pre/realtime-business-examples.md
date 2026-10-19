---
"@nocobase/app-plugin-notification-example": minor
"@nocobase/app-plugin-realtime-example": minor
"@nocobase/app-template-examples": patch
---

Add realistic realtime workflows for collaborative task boards, personal inbox synchronization, and durable background CSV exports. Reuse participant-authorized task data and existing in-app notifications, expose task invalidation and export-read contracts, and retain the technical capability lab as a secondary view.

Store CSV export content as LONGTEXT on MySQL so files larger than 64 KiB can be saved without truncation, while retaining the existing text mapping on other databases.
