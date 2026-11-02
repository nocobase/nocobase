---
'@nocobase/app-plugin-releases': minor
---

Allow releases.artifact to reference a named drive disk with an optional relative artifact key prefix. The referenced disk is validated with the drive's own rules and must be private. Repeated slashes in the prefix are collapsed. Preserve full disk configurations and existing artifact keys when changing the prefix.
