---
'@nocobase/authorization': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-api-keys': patch
---

`SystemApiKeys.adopt` reads the grants the account holds in its own transaction instead of trusting the caller (given `permissions` must each be held, `ADOPT_NOT_HELD`), and answers again only for the same key (`ALREADY_SYSTEM_KEY` otherwise). Chosen records are checked against what the giver reaches, restriction rules included, under every role. Disabling or deleting a managed key commits its state, activity and notice together, and the manager gets the notice's `noticeId` on every attempt. `GET /api/apiKeys/scopeRecords` searches and pages in the database, and the system key list pages. Permission check shows, for a key's chosen records, which it reaches now and which the roles and rules leave out (`POST /api/authorization/inspector/records`), and reads a format-1 key's record limits as converted. A Permission Set prefix protection reserves its prefix against other owners, and API keys report sets already named in `system-key-` at boot.

"Same as me" personal keys stay off by default. An application whose callers create them — Studio's CLI and tests do — sets `apiKeys.allowSameAsMe: true`; for Studio that one configuration line is the only change this release needs.
