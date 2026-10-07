---
'@nocobase/app-cli': patch
---

`pnpm build --target` retargets platform packages published under the bare platform and architecture (`sqlite-vec-linux-x64`, `sqlite-vec-windows-x64`) as well as the napi-rs names, and removes a platform package whose set publishes no build for the target, as an install there would, instead of failing the build.
