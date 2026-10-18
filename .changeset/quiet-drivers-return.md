---
'@nocobase/drive': minor
'@nocobase/app-server': patch
'@nocobase/app-plugin-releases': patch
'@nocobase/app-skills': patch
---

Support synchronous custom driver factories alongside existing configuration objects in `drive.disks`. Create drivers lazily through the shared application Drive provider, preserve Flydrive caching and fakes, and reject factory references where release artifacts require serializable Host configuration. Document custom driver setup and initialization responsibilities. Consumers reading disk configuration fields must narrow out factory functions first.
