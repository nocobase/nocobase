---
'@nocobase/drive': minor
'@nocobase/app-server': patch
'@nocobase/app-plugin-releases': patch
'@nocobase/app-skills': patch
---

Support synchronous custom driver factories alongside existing configuration objects in `drive.disks`. Create drivers lazily through the shared application Drive provider, preserve Flydrive caching and fakes, and reject factory references where release artifacts require serializable Host configuration. Ship the `nocobase-drive` Skill with filesystem, S3, native Aliyun OSS, and custom driver guides, and direct application guidance to that shared documentation. Consumers reading disk configuration fields must narrow out factory functions first.
