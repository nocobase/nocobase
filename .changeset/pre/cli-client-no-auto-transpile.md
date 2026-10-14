---
'@nocobase/app-cli-client': patch
---

Keep oclif from registering tsx when a packaged CLI runs from sources under `NODE_ENV=development` or `test`, which made every cold start about half again as slow.
