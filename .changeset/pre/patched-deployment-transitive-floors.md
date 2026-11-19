---
'@nocobase/document-extractor': patch
'@nocobase/app-cli': patch
'@nocobase/app-host-docker': patch
---

Keep fresh production installations on patched argparse 1 and ansi-regex 5 releases. Upgrading argparse within its compatible major removes the vulnerable Lodash 3 dependency without forcing Lodash across major versions.
