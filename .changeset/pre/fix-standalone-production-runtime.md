---
'@nocobase/app-server': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Locate a built application's `config.yml` next to `dist/` when none exists inside it, build the client against the same `.env` files the server loads, and prefer the compiled dependency tree when resolving plugins from a production build.
