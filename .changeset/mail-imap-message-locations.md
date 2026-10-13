---
"@nocobase/app-plugin-mail": minor
---

Give IMAP messages a reliable identity and track every remote copy. A message is identified by the server's OBJECTID `EMAILID`, then Gmail's `X-GM-MSGID`, then an RFC `Message-ID` proven by byte-identical MIME, and otherwise by its folder, UIDVALIDITY and UID. Each copy is stored in the new `mailMessageImapLocations` collection; read state, star state and folders are derived from the verified copies, flag changes and permanent deletion apply to every copy (permanent deletion now requires UIDPLUS), and a message without copies is removed only when a sync run completes after two matching full verification passes. The new migration `202610250001_mail_imap_message_locations` supports only a mail store without messages and refuses to run, before changing any structure, while messages or related business data exist. UID, UIDVALIDITY, identity source and location status bounds are validated by application writes; this migration does not install database CHECK constraints, so direct database writes can bypass those bounds.

Keep opaque remote attachment IDs out of local upload UUID queries so localized drafts can read their remote attachments on PostgreSQL while preserving upload ownership and expiration checks.
