---
"@nocobase/app-plugin-api-keys": patch
---

Verify unscoped key endpoint access against Better Auth 1.7.21 and align the API key security guidance with regression tests: keys cannot manage keys, password changes need a sign-in session, and with the templates' `bearer()` plugin the token `/list-sessions` returns replays as a full sign-in session, so unscoped keys need a scope or an App `before` hook on that path.
