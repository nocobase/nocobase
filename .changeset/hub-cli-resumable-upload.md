---
'@nocobase/hub-cli': minor
'@nocobase/app-plugin-hub': minor
'@nocobase/app-template-hub': minor
---

`hub deploy` and `hub upload` send the archive through the Hub's resumable upload, so an archive may be up to 2 GiB and a reverse proxy in front of the Hub only needs to allow a request the size of one chunk (8 MiB). A chunk whose answer is lost is sent again from the offset the Hub reports, after up to five consecutive failures of the chunk or of the read that finds the offset; a run that gives up leaves its session on the Hub for 24 hours so the same command resumes it, and an archive the Hub already has is not sent again. Progress is reported by the tenth.

The Hub accepts resumable Release uploads under `/api/hub/apps/:appId/releases/uploads` with the `upload-release` action or publishing-key scope: `POST` starts a session for `{ size, sha256 }` (resuming an unfinished one for the same archive, or answering with the Release when the App already has it), `PUT /:uploadId` appends a chunk at `Upload-Offset` (`409 UPLOAD_OFFSET_MISMATCH` reports the offset to continue from), `GET /:uploadId` reports the offset, and `POST /:uploadId/complete` verifies the archive and creates the Release through the same checks as the single upload, answering a retried completion with the same Release. Sessions are staged on the Hub's local disk under the new `uploadsDir` option, which the Hub template sets to `storage/hub/uploads`, one directory per App, and expire 24 hours after their last chunk; an App's expired sessions are removed when one of its uploads starts, and every App's once an hour. `POST /api/hub/apps/:appId/releases`, which the management console uses, keeps its 256 MiB limit.
