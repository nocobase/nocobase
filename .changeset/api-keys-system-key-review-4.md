---
'@nocobase/authorization': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-api-keys': patch
---

A Permission Set protected by name stays its owner's even under another owner's protected key prefix, whichever is registered first, so an application whose root or default set is named in a reserved prefix still starts; a prefix protection may also leave named keys alone (`except`). Deleting a user whose deletion was interrupted after the account was marked deleted finishes the remaining cleanup instead of doing nothing.
