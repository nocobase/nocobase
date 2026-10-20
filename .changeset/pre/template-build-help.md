---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Add build command help that exits before loading build dependencies or changing deployment artifacts. Record deployment target metadata even when no native modules are present, detect musl for current-machine Linux builds, and document the platform and Node fields available for deployment checks.
