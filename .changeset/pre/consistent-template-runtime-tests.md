---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Transform all published plugin client entry points with AppClient in generated-application tests, preserving shared service tokens during real application startup as well as Router and application contexts in component tests. Keep server modules outside this transformation boundary.
