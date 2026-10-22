---
'@nocobase/db': minor
---

Add `connection.restrict(policies, principal)` for restricted repository access with an explicit collection allowlist, narrowing-only repositories, and policy-preserving transactions. Export `RestrictedDatabase` and `DatabasePolicyMap`, and keep policy explanations detached from mutable defaults.

Keep `withPolicies()` and `ScopedDatabaseConnection` supported for policy binding with full connection capabilities. Adopting `restrict()` requires policies for every directly accessed collection and keeping raw database operations on the trusted connection. Custom implementations and complete mocks of `DatabaseConnection` must implement the new `restrict()` method.
