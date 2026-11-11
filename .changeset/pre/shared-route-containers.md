---
'@nocobase/app-client': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-releases': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Share the route container contexts through `@nocobase/app-client/route-containers` so plugin dialogs, drawers and child pages open in the container the application shows while they load, keep a hosted child page's layout classes, and declare presentations for the remaining Examples and plugin overlays.
