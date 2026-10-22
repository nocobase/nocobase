# Isolate application cookies on a shared host

Applications mounted at different public paths need distinct language-session and authentication cookie names, including when one application is mounted at `/` or beneath another. The defaults use the full public path, preserve case and punctuation, and normalize leading/trailing slashes. Authentication also retains its public-port or standalone-listen-port distinction. An internal proxy path or the last path segment is not an application identity.

Updating dependencies alone does not update the template source copied into an existing application. Merge the following edits into each application's source, keeping its unrelated configuration. Apply them in both Default-derived and Examples-derived applications; do not copy one application's live configuration or keys into another.

## Apply the source changes

1. Upgrade the application's matching framework and authentication dependencies to a release containing this fix through the normal template upgrade workflow. `@nocobase/app-server/support` must export `createAppCookieScope` before using the following source. Keep the existing package placement in `dependencies` or `devDependencies`.
2. In `server/config/session.ts`, import the shared path functions and add `routing` to the existing defaults callback. Replace only the default cookie name and path; retain the other session options, stores and environment mappings:

```ts
import {
  createAppCookieScope,
  normalizeBasePath,
} from '@nocobase/app-server/support';

// Inside defineAppConfig, preserving the other defaults:
defaults: ({ paths, env, routing }) => ({
  // Keep the existing enabled/default/store/lifetime settings here.
  cookie: {
    name: `nocobase_session_${createAppCookieScope(routing.publicBasePath)}`,
    path: normalizeBasePath(routing.publicBasePath) || '/',
    // Keep the existing secure/httpOnly/sameSite and other attributes here.
  },
}),
```

3. In `server/config/app.ts`, preserve an explicit root mount. Replace `normalizeBasePath(routing.publicBasePath || '/main')` with `normalizeBasePath(routing.publicBasePath)`. The runtime already supplies `/main` when no mount path was configured; an empty path means the origin root. Keep the existing name and public API URL derivation.
4. Review explicit overrides in the application's deployment configuration and `server/config/auth.ts`. `session.cookie.name/path`, `auth.advanced.cookiePrefix`, `auth.advanced.cookies` and cookie attribute overrides still win over defaults. A fixed old name or shared prefix opts out of automatic isolation: give every overlapping application a unique value, or remove the override to use the new defaults. Do not automatically erase an intentional customization.
5. Run the application checks and build, then restart through the normal deployment process:

```bash
pnpm nocobase config check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

If merging the template's regression tests, include `tests/logic/session-isolation.test.ts`; it uses the application's own configuration and shared synthetic test keys/storage to test the cookie boundary. Never point it at deployment sessions or databases.

## Expected upgrade behavior

Default login cookies change names, so visitors sign in again once. Language preferences in browser storage are also scoped to the application; an old shared preference is ignored and each application initially uses its own default language. The existing browser-to-server synchronization creates the new language session.

Old cookies are not read, migrated or proactively deleted. Old server records expire according to their existing policy rather than being revoked in bulk. A rollback can recognize the previous login cookies again. Explicit authentication names that remain unchanged do not require a new login solely because of this fix.

## Verify the deployment

Use one browser profile to visit sibling paths, a root application and a child, nested applications, and applications with the same final path segment. Sign in to each, switch their languages independently, refresh a deep route, and sign out of one. The other applications must retain their login and server language. A child without its own cookie must ignore a parent's cookie even though the browser sends it with the request.

In the browser's network/storage tools, check that language-session names start with `nocobase_session_` followed by the encoded full path, authentication names include `__` followed by that same scope, and paths match each application's public mount (`/` at the root). For example `/team/crm` uses scope `%2Fteam%2Fcrm`; `/crm` uses `%2Fcrm`. Check sign-out and session clearing delete only that application's names and leave old or sibling cookies intact. Do not copy cookie values into verification reports.

No database migration, additional endpoint or request is required. This prevents accidental session reuse between applications; paths on the same origin are not a security boundary against a malicious application.
