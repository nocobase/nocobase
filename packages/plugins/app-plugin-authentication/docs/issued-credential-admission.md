# Application admission for issued credentials

`Auth.addCredentialRoutePolicy((context, credential) => decision)` lets an assembled application apply the same issued-credential identity policy to its command manifest and direct HTTP requests. It returns a function that unregisters the policy. It never applies to ordinary sessions, API keys or service-account keys, and it never authenticates an invalid or expired credential.

- `undefined` keeps the route's `describeRoute().security` and `required({ scopedKeys: true })` admission rules.
- `false` refuses the credential with `CREDENTIAL_NOT_ACCEPTED`. Any refusal wins over all registered grants.
- `true` admits this issued credential, including on a route that previously required an unscoped session. The application takes responsibility for enforcing its credential's scope there.

Authentication still resolves the credential's current user. Every endpoint must retain its business authorization and object visibility checks. An application granting admission must audit routes that previously relied on session-only authentication, install its authorization middleware where needed, preserve action restrictions, and update its generated API document's security and CLI identities together. Do not use this hook to admit arbitrary API keys or to replace authorization with identity checks.

The policy runs after credential authentication and before input handlers. Connection-bound Auth instances share the same policies. A policy that uses a cached command index adds only memory lookup on warm requests; it should not query or write application state on each admission.

`Auth.credentialRouteDecision(context, credential)` exposes the same policy result to a plugin that has an additional issued-credential guard after `Auth.required()`. Only an explicit `true` relaxes that guard; `undefined` keeps its native rules and any policy refusal still wins. Knowledge and conversation routes use it before their existing document ACL and conversation-owner checks. Ordinary scoped API keys remain subject to their native restrictions.
