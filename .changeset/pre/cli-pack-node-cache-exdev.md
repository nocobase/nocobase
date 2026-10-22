---
'@nocobase/app-cli': patch
---

Extract the Node.js that `nocobase cli build` packs inside its cache rather than the system temporary directory, so the build no longer fails with EXDEV where `/tmp` is a separate filesystem, such as on GitHub's ubuntu-26.04 runners.
