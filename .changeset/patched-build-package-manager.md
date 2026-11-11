---
'@nocobase/create-app': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-multi-app': patch
'@nocobase/app-cli': patch
---

Use pnpm 11.11.0 for source and generated application builds. Its remote tarball integrity handling allows production installations of the official patched SheetJS distribution; applications using that distribution should update their packageManager pin before building with pnpm 11.
