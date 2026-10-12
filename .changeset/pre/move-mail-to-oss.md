---
'@nocobase/app-plugin-mail': patch
'@nocobase/app-plugin-mail-example': patch
'@nocobase/app-template-examples': patch
---

Move Mail and its offline provider example into the open-source NocoBase 3 workspace. Keep their package names, public APIs, database migrations, and version history, and publish future releases through the OSS release pipeline. The Examples template loads both plugins with three offline demo providers. Other templates keep Mail opt-in and do not load the demo.
