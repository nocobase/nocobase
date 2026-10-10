---
'@nocobase/app-client': major
'@nocobase/app-template-default': patch
---

Pass the complete client plugin composition to `defineAppRuntime()`.

The runtime now resolves plugin route component overrides from the same `AppClientPlugins` object as every other plugin contribution, while application route overrides remain a separate declaration.

The Client Application now validates the auth provider and guest login route required by authenticated routes internally, keeping those details out of application composition roots.
