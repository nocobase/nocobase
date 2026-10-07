---
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/app-template-hub": patch
---

Encrypt third-party OAuth tokens at rest by setting Better Auth's `account.encryptOAuthTokens: true` in `server/config/auth.ts`. The `accessToken`, `refreshToken` and `idToken` of an `account` row are encrypted with XChaCha20-Poly1305 under a key derived from `auth.secret`, so changing `auth.secret` makes stored tokens unreadable and the user has to link the provider again. Rows written before the option was on keep working: Better Auth returns a value unchanged when it does not look encrypted (no `$ba$` prefix and not an even-length hex string) and encrypts it on the next write, such as a sign-in or token refresh. An existing application adopts this by adding `account: { encryptOAuthTokens: true }` to the `defaults` of its own `server/config/auth.ts`.
