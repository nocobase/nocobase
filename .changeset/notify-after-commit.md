---
'@nocobase/authorization': minor
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-users': patch
---

A permission-set service bound with `withTransaction(connection)` to a `@nocobase/db` connection now publishes its grant-change notifications after that transaction commits, and drops them on rollback, instead of publishing nothing and leaving it to the caller. Call `notifyAssignmentsChanged(subject)` on the bound service inside the transaction; calling the unbound service again after the commit is no longer needed and only repeats the refresh. A transaction of any other type keeps the previous behaviour. The authorization Skill and READMEs describe the new pattern.

User management registers `onRoleScopesChanged` with `afterCommit` inside the transaction that changes the role scopes, so a failing notification is reported through the connection's `onTransactionCallbackError` instead of failing a request whose change has already committed, and deleting a user who no longer exists notifies nobody.
