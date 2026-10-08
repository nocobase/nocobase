---
'@nocobase/app-server': minor
---

A route's `cliRoute({ ticketUpload: { optional: true } })` makes its upload file optional: given the file, the CLI sends its name in the body field named like the flag, and the route answers an upload ticket the file is streamed to; without it, the route answers its own result. One command can then deploy either an archive or a release that exists.
