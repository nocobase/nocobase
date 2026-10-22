---
'@nocobase/app-server': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Isolate language sessions and all default authentication cookies by the complete public application mount path, including root and nested applications. Preserve port isolation and explicit cookie configuration. Fix template root-path configuration and share a cookie-name-safe path encoder.

Visitors using default authentication cookie names must sign in again after upgrading. Old cookies and server records are neither migrated nor deleted; records expire normally, and rolling back can recognize old logins again. Explicit names and prefixes remain unchanged and must be unique across applications with overlapping paths.

Existing applications must merge the updated `server/config/session.ts` and root-path handling in `server/config/app.ts` into their own source as well as upgrade dependencies; dependency updates alone do not replace copied template configuration. See the application cookie isolation guide in the upgrade Skill for the exact edits and verification steps.
