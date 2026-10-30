---
"@nocobase/app-plugin-concurrency": minor
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/app-skills": patch
---

Rename the unpublished Mutex adapter to @nocobase/app-plugin-concurrency and add its application-owned service token, Provider, strict named configuration and pure configuration factory. Default and Examples explicitly register the plugin and its in-process Mutex configuration. Install the compatible concurrency core and host peers; the default remains process-local and does not coordinate multiple instances. Server APIs, including deliberate low-level Mutex construction, are exported from /server; configuration uses /config. No library-style package-root export, private implementation subpath, app-server concurrency subpath or old-package alias is provided.
