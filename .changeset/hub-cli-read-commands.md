---
'@nocobase/hub-cli': minor
'@nocobase/app-plugin-hub': minor
---

`hub releases` lists an App's Releases newest first — ID, version, checksum, size, `uploadedAt`, the `buildTarget` the archive records, whether it is what the App runs now (`running`) and whether a deployment of it ever succeeded (`everDeployed`) — with `--limit` (1–100, default 20) and `--release-id` for one. `hub status` reports the remote, the platform the Hub builds the App for, the Release and version it runs, the Host's state for it and its last deployment, and `hub status --deployment <id>` one deployment's status. Both read with a key holding either publishing permission, so finding the Release to roll back to no longer needs the Hub's web page.

A publishing key holding either scope for an App can now read `GET /api/hub/apps/:appId/releases`, `GET /api/hub/apps/:appId/releases/:releaseId` and `GET /api/hub/apps/:appId/deployments`. The Release list takes an optional `limit` (1–100, answered with `400 INVALID_LIMIT` otherwise; every Release when omitted), each Release reports `buildTarget`, `running` and `everDeployed`, and deployment list items carry `finishedAt`. Deployment configuration, deployment details and logs stay signed-in only.
