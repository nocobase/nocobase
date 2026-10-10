---
'@nocobase/app-cli': patch
'@nocobase/app-template-default': patch
---

Remove the duplicate application plugin registry from package.json. Discover registered plugins from explicit Client, Server, and CLI composition roots for CLI updates, Skills synchronization, and development watches, and package server dependencies from compiled imports. Preserve legacy metadata cleanup during unregistration.
