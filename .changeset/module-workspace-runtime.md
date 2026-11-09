---
'@nocobase/db': minor
'@nocobase/app-server': minor
'@nocobase/app-cli': minor
'@nocobase/app-host': patch
---

Support application-owned database task coordination and pending-task selection while retaining complete history validation. Expose the database task lease for module lifecycle operations, recognize app-module packages in CLI registration and Skills, preserve third-party dependency patches in standalone builds, and prevent explicitly stopped deployments from restarting on incoming traffic.
