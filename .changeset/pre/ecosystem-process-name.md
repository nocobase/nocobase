---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

`ecosystem.config.js` no longer names every application after its template. The pm2 process name is `nocobase-` followed by the application's package name without its scope, read from `package.json` or, beside an unpacked deployment archive, from `dist/package.json`, and `APP_PM2_NAME` overrides it. Two applications created from the same template can now run under pm2 on one machine; before, the second `pm2 start` restarted the first.
