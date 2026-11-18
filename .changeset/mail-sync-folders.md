---
'@nocobase/app-plugin-mail': minor
---

Choose the folders each mail account synchronizes. Connecting an account now lists its folders first and starts importing once its owner chooses them (every folder by default), and the account list changes the selection later. IMAP, Microsoft 365 and Gmail synchronize only the chosen folders in initial, automatic and push runs; narrowing the selection shows how many local messages it deletes, then removes local messages left in no chosen folder without touching the mail server; a chosen folder deleted on the server takes its local messages with it on the next run. `PATCH /api/mail/accounts/:accountId` accepts `syncFolderIds`, `POST /api/mail/accounts/:accountId/previewSyncFolders` previews the deletion, and `GET /api/mail/accounts/:accountId/folders?includeUnsynced=true` lists unselected folders. Migration `202611180001_mail_account_sync_folders` adds the nullable `syncFolderIds` column; existing accounts keep synchronizing every folder.
