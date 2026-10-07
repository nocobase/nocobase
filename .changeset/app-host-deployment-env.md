---
'@nocobase/app-host': minor
---

An App's deployment spec carries environment variables (`HostDeploymentSpec.env`), given to that App alone: an in-process App reads them as its scope's environment (`AppDefinition.env`, `AppScope.env`), and a Docker App gets them in its container, before the variables the container sets itself, which they never replace. The Host's own environment stays as it was, and values are never logged.
