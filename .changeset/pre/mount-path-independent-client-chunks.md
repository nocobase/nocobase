---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Resolve client chunk URLs at run time so a built application works wherever it is mounted.

Vite bakes `base` into the bundle at build time, while an App Host mounts a deployed application under its own App ID. A build made for `/main` and deployed as `/crm` therefore asked for `/main/assets/<chunk>.js` and got a 404 for every chunk the browser had to fetch at run time, which is every lazily imported route: the application loaded, its shell rendered, and each lazy page failed with "Route … could not be loaded". Pages whose chunks `index.html` preloads kept working, so the failure looked like it belonged to a particular plugin rather than to the deployment.

Only the URLs emitted into JavaScript become runtime-relative, resolved against `import.meta.url`; every chunk sits beside the entry chunk, so this is correct at any mount path. The URLs in `index.html` stay absolute: the document is served at arbitrary SPA route depths where a relative URL would resolve against the current route, and the Host rewrites those root-relative attributes to the mount path, which it can only do while they start with `/`.

Applications generated from these templates need to rebuild to pick this up. No configuration changes, and a build deployed at the path it was built for behaves as before.
