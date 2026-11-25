---
'@nocobase/app-server': patch
---

Record application migrations under the application's package name when the Host loads a release in-process. The package name now comes from the same manifest lookup the SPA uses (`package.json`, then `dist/package.json`), so in-process, standalone, Docker and CLI runs of the same release share one migration identity instead of the in-process run falling back to `app`.
