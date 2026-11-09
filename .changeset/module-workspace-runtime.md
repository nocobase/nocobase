---
'@nocobase/db': minor
'@nocobase/app-server': minor
'@nocobase/app-cli': minor
'@nocobase/app-host': patch
---

Support named connection contributions with database/<connection> migration and seed directories, keeping legacy flat plugin tasks on the default connection. Support application-owned database task coordination and pending-task selection while retaining complete history validation. Expose the database task lease for module lifecycle operations, recognize scoped app-plugin and app-module packages in CLI registration, removal and Skills, preserve third-party dependency patches in standalone builds, and prevent explicitly stopped deployments from restarting on incoming traffic.
