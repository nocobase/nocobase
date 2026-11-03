---
'@nocobase/app-plugin-users': minor
---

Let an application role scope refuse who acts on whom. A scope's optional `assertCanAdminister(userId, actorId, action, connection)` is called for `update`, `disable`, `enable`, `reset-password`, `revoke-sessions` and `assign-role` with the authenticated actor, inside the action's transaction and before anything changes; a refusal answers `FAILED_PRECONDITION`. An application can then keep, for example, anyone but an owner from resetting an owner's password. The management service's account methods take the actor as an optional last argument; calls without one are not checked.
