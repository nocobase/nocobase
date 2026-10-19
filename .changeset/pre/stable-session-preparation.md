---
'@nocobase/realtime': minor
'@nocobase/app-plugin-authentication': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Prepare the signed-in realtime identity before mounting template pages to avoid repeated loading after login. Expose session preparation and retry state, and show a retryable connection error with sign-out when initialization times out. Keep runtime permission invalidation and session isolation.
