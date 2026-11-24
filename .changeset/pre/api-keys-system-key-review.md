---
'@nocobase/authorization': minor
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-api-keys': minor
'@nocobase/app-plugin-authz-sharing-rules': minor
'@nocobase/app-plugin-users': minor
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

System keys act as no person: a record access can be declared `personal` (the built-in "records I own" and "records I created" are), and a key scope marked `personless` gets no records from default access or sharing rules that select by one, while restriction rules still apply; sharing rules refuse subjects a subject type keeps from being shared with (`filterShareable`), which the users plugin uses to refuse service accounts. Permission Sets can be protected by key prefix, so every process protects a system key's hidden set, including one another process created later.

A system key's data scope may be limited to chosen records the person giving it can see (`GET /api/apiKeys/scopeRecords`, the permission table's "Selected records"), checked again on the server; every record or records of another person are refused. Permission changes are serialized per key and written with their activity in one transaction. Owners must be active members, and owners are told a week before a system key expires. Idle disabling follows the rule each key took when it was created or rotated, and rotating clears the last reminder. Managed keys are only viewed, disabled or deleted by administrators; notices to their manager are stored and delivered again until taken. `adopt` takes the key to adopt, keeps its own scope and runs in one transaction. The system key and members' key lists filter and page in the database. Permission check shows a key's state, what it covers and the records it keeps, refuses everything for a disabled or expired key, and opens from a personal key's detail too.
