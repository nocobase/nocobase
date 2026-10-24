---
'@nocobase/app-cli': patch
'@nocobase/app-testing': patch
'@nocobase/app-skills': patch
---

Isolate application command test storage in the test configuration directory. Respect the application mount path in test router links and navigation, and clean up runtime configuration immediately when initialization or rendering fails. Preserve the original failure when cleanup also fails, without reporting handled cleanup failures again at test completion. Document the test helpers' storage, routing and cleanup contracts.
