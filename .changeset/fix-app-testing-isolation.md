---
'@nocobase/app-cli': patch
'@nocobase/app-testing': patch
'@nocobase/app-skills': patch
---

Isolate application command test storage in the test configuration directory. Preserve client application providers and state during rerenders, respect the application mount path in router links and navigation, and clean up runtime configuration when initialization fails. Preserve initialization and rendering errors when cleanup also fails, without reporting handled cleanup failures again at test completion. Document the test helpers' storage and routing contracts.
