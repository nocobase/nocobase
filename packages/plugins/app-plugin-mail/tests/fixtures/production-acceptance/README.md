# Mail production acceptance fixture

This independent fixture verifies an application-owned `/mail/accounts` route and `/mail` workspace in a real Vite production build, using the public `@nocobase/app-plugin-mail/client` entry. It does not replace or modify the responsive workspace fixture, intercept Mail APIs, or use fixture access cookies.

## Prerequisites and execution

Use the repository's existing dependencies and built `packages/templates/app-template-examples/dist` deployment, including its vendored Mail and authentication/authorization plugins. `packages/tools/app-testing/dist/src/server/app-config.js` must also exist. Rebuild those packages through their normal scripts when the compiled output is stale; do not copy deployment trees or install fixture dependencies. The database provisioner honors `NOCOBASE_TEST_DB_DIALECT` (SQLite only when unset); the built deployment must support the selected driver. The small browser build uses the default template's already installed Vite, React and Tailwind tooling.

From the repository root:

```bash
pnpm --filter @nocobase/app-plugin-mail exec eslint tests/fixtures/production-acceptance tests/playwright/production-acceptance.config.ts tests/playwright/mail-production-acceptance.test.ts --max-warnings 0
pnpm --filter @nocobase/app-plugin-mail exec tsc -p tests/fixtures/production-acceptance/tsconfig.json --noEmit
MAIL_PRODUCTION_ACCEPTANCE_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  pnpm --filter @nocobase/app-plugin-mail exec playwright test --config tests/playwright/production-acceptance.config.ts
```

Omit `MAIL_PRODUCTION_ACCEPTANCE_EXECUTABLE` when Playwright's Chromium is installed, or set it to another compatible local Chromium executable. `MAIL_PRODUCTION_ACCEPTANCE_PORT` changes the loopback port (default `59118`). The config deliberately refuses to reuse another server and the test skips under other Playwright configurations. To repeat the complete acceptance from clean databases, run the command again; do not use `--repeat-each`, which would share one fixture database and its saved accounts.

## Real boundaries exercised

- `ClientApplication`, `AppClientRoot`, the actual authentication/authorization/Mail service and React providers, `MailClient`, i18n and the default template's `AppThemeProvider` render the application. Vite's `import.meta.env.PROD` is true and runtime dev routes are empty.
- The actual default template `renderRouteTree` and `ClientRoute` check the real server-backed `useCan` permission snapshot before loading pages, under the authentication plugin's actual `RequiredAuthentication` guard. The fixture only supplies application routing and a small login destination, not mocked guards or a replacement permission service.
- The compiled examples standalone server starts with explicit `NODE_ENV: production`, an owned temporary configuration/root/deployment/storage directory, no Vite proxy, and migrated test databases provisioned through `createTestAppConfig` from `@nocobase/app-testing`. It never starts an existing application or uses its database. Ambient environment values are cleared for that server scope, and dotenv lookup is rooted at the owned temporary directory.
- A separate full compiled-engine startup uses the compatible default Dev return, records exactly one structured warning in its own temporary logs, remains operational, and cleans its database/storage; it does not substitute a boot-only provider.
- Service tokens are imported from the deployment's own package manifests, preserving vendored module identity. `createTestApp` itself cannot wrap this compiled deployment: its workspace `databaseManagerToken` is not the deployment's token, so only the test configuration provisioner is shared.
- Two ordinary transient users sign in through actual authentication routes and receive real session cookies. Only one holds a persisted permission set granting `page/mail.workspace/access`; neither browser user is root. Anonymous pages redirect to login, denied pages render the actual template's access-denied page, and Mail APIs enforce real `401`/`403` fences. A denied malformed authorization write returns `403` before input validation.
- A test-only `acceptance-local` OAuth definition is registered in the actual `MailProviderRegistry`. The local HTTP authorize endpoint returns to the real public callback; real state consumption, PKCE verifier retrieval, credential-vault writes and `MailAuthorizationService` account persistence run. No Google/Microsoft/IMAP/SMTP APIs are involved.
- Root and `/main` API checks independently prove callback success/failure, account persistence, original query preservation and replacement of the existing `mailAuthorization` value. The `/main` browser clicks the actual account connector, observes the success notice and a newly saved second account, reloads it, observes the ordinary failure notice after local denial, then opens the real workspace and its production accounts link. Return URLs and account responses contain no provider codes, errors, tokens or credential references.

## Safety, cleanup and limits

The fake adapter cannot send mail and only returns empty local folders/messages. The production service automatically schedules initial sync when it saves a new account, so that real initial sync is retained rather than mocked or described as disabled; it has no network or real mailbox effects. The automatic sync interval is one day. The examples deployment also contributes its own demo providers; the test explicitly selects only the local provider.

Playwright sends `SIGTERM` and allows graceful shutdown. The fixture closes its HTTP listener and actual server, drops its own databases and removes its own temporary configuration/storage. `cleanup-root.json` and `cleanup-main.json` assert removal. Build output, JSON results, failure traces and server/cleanup evidence remain under ignored `.tmp/mail-issue8-production/`. No user files, environment files, application databases or real mailbox records are read or changed. A hard process kill can bypass graceful cleanup, as it can for any database fixture.

The root-path acceptance is API-level, while the browser production build is served under `/main` only. The surrounding application shell is intentionally minimal: the actual template route/authentication/authorization/theme infrastructure is used, but the template's sidebar/settings chrome and real login form are not bundled. This verifies local OAuth integration and production permission boundaries, not external provider token exchange, real mail synchronization, or live account credentials.
