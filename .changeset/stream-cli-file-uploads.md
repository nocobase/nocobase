---
'@nocobase/app-cli-client': patch
---

Keep large CLI file uploads within bounded memory and allow multipart commands up to 30 minutes to complete, while closing file streams on cancellation or failure.
