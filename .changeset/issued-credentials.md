---
'@nocobase/app-server': minor
---

Add issued credentials: `Auth.addCredentialResolver()` lets a plugin recognize a credential of its own, such as an agent's run token, as a scoped session acting for a user (`AuthSession.credential`). A route accepts it only when it opts in to scoped credentials and its own security requirements list the credential's scheme; otherwise it answers 403 `CREDENTIAL_NOT_ACCEPTED`. `@nocobase/app-server/router` adds `declaredRouteOf()` and `routeAcceptsScheme()` for reading the answering route's declaration from a middleware.
