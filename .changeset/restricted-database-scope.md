---
'@nocobase/db': minor
---

Add `connection.scope(policies, principal)` for restricted repository access with an explicit collection allowlist, narrowing-only repositories, and policy-preserving transactions. Export `DatabaseScope` and `DatabaseScopePolicies`, and keep policy explanations detached from mutable defaults.

Deprecate `withPolicies()` and `ScopedDatabaseConnection` while preserving their legacy behavior. Migrating to `scope()` requires policies for every directly accessed collection and moving raw database operations to the trusted connection. Custom implementations and complete mocks of `DatabaseConnection` must implement the new `scope()` method.
