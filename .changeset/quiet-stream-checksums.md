---
'@nocobase/drive': patch
---

Only calculate S3 request checksums and validate response checksums when required, allowing streams of unknown length to upload to S3-compatible storage.
