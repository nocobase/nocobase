---
'@nocobase/app-server': minor
'@nocobase/app-cli': minor
---

Add application-local database preparation hooks and use the same storage preparation, reset, hook and migration/Seed phases with or without hooks. Fresh runs now reset all selected migration targets before any business task, with no cross-connection rollback. Report preparation failures and confirmed resets without expanding successful CLI JSON output.
