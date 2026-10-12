---
'@nocobase/app-plugin-agents': patch
'@nocobase/app-cli-client': patch
'@nocobase/studio': patch
---

Prevent concurrent and repeated retries of the same run, retain retry attribution, and link retried runs to their replacements. Automatically settle obsolete failed-run decisions after retries, new work, reassignment, or issue completion, including outstanding cards from earlier releases.
