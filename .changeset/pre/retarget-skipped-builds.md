---
'@nocobase/app-cli': patch
---

Stop `pnpm build --target` from failing on a native package whose build `allowBuilds` skips, such as `cpu-features`. Such a package is now classified by the binaries it ships: bundled prebuilds like `better-sqlite3`'s are still trimmed to the target's, and one that ships none is left as installed.
