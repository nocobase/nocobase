---
'@nocobase/drive': minor
---

Export `parseDriveDiskConfig` and `DriveDiskConfigError` to validate a disk configuration without echoing its values, and declare `forcePathStyle` and `supportsACL` on S3 disks as optional, since the S3 driver applies its own defaults when they are omitted.
