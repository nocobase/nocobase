---
'@nocobase/app-host': patch
---

Identify an installed artifact revision by its archive checksum when deploying, as restoring already does, instead of reading and hashing every expanded file again. A large application release (about 42,000 files, 366 MB expanded) spent 3 to 8 seconds of each deployment in that hash.
