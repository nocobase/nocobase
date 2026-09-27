---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

`ecosystem.config.js` now starts the application under pm2. It used to point `script` at `./dist/server/standalone.js`, which pm2's fork mode loads through its own wrapper: `import.meta.main` is then false, `standalone.js` never calls `startServer()`, and pm2 keeps reporting the process as online while nothing listens (the Hub template even exits and restarts in a loop with empty logs). The file now has pm2 run `node ./dist/server/standalone.js` directly with `interpreter: 'none'`, which keeps `standalone.js` the main module.

Existing applications that deploy with pm2 should make the same change to their own `ecosystem.config.js`: replace `script: './dist/server/standalone.js'` and `interpreter: 'node'` with `script: 'node'`, `args: './dist/server/standalone.js'`, `cwd: import.meta.dirname` and `interpreter: 'none'`. `cwd` resolves the relative `args` against the file's own directory, so `pm2 start /path/to/ecosystem.config.js` works from any directory.
