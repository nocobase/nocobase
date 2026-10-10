---
"@nocobase/app-plugin-dag-flow": patch
---

Say what to do when a workflow's enabled hash is missing from the production build. `Workflow Artifact <key>/<hash> is missing` now explains that the database still points at an earlier build's hash and that the deployed version has to be enabled by its new hash, through **Enable new version** in workflow management or the enable route, because enabling by workflow id keeps the missing hash.
