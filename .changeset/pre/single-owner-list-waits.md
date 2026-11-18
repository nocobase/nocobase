---
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/app-plugin-repository-example": patch
"@nocobase/app-skills": patch
---

Announce each list wait once and per query: a retry after a refresh failure on the Roles page is no longer announced twice, a search or page that replaces a pending one restarts its own loading delay instead of inheriting an earlier long-wait note, first-load and next-page statuses sit outside their busy regions, and the Repository example CRM list uses the shared loading, refresh and retry feedback.
