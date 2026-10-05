---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

Wait for the application shell to render the collapsed and expanded navigation in the shell test, instead of asserting right after the click. The toggle writes the shared sidebar preference, and the shell only re-renders from it once its subscription effect has run, which can still be pending after a lazily loaded mount on a loaded machine.
