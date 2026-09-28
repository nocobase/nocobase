---
'@nocobase/create-plugin': patch
---

The `--json` document is built by the new `@nocobase/cli-envelope` dependency rather than by a copy of the envelope kept here, and `bin/run.js` runs that package's Node.js guard. What is printed is unchanged, except that the text for an unsupported Node.js, without `--json`, now reads `[create-plugin]: Node.js 24 or later is required.` on two lines, as the other tools print it.
