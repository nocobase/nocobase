# Testing and verification

## Where tests go

```text
tests/logic/        Logic and integration tests
tests/components/   Component tests
e2e/                Tests needing a real server, real auth, or a real database
```

**Never put a test beside the source it covers.** Name files `*.test.ts` or `*.test.tsx`.

`vitest.config.ts` discovers `tests/**/*.test.{ts,tsx}` automatically. Theme token tests compile the real CSS; browser checks still need to verify computed styles, typography, spacing and focus.

Templates ship their tests into generated applications. Keep them runnable from the application root after scaffolding: read application identity from `package.json`, resolve application paths relative to the test file, and import dependencies through their published package exports. Do not depend on a monorepo checkout, a fixed template directory name, or a particular pnpm store layout. Run the affected test files in the generated application as well as in the template when changing these contracts.

## What to test, by change

| You changed      | Test at least                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| A server route   | Anonymous → `401`, authenticated but unpermitted → `403`, permitted → expected payload            |
| A public webhook | Missing signature, invalid signature, valid signature, duplicate delivery                         |
| A migration      | `up` produces the expected schema; `down` reverses it; against a real database                    |
| A seed           | First run, run against existing data, repeat run                                                  |
| A service        | Its domain behavior, with its dependencies supplied directly                                      |
| A job            | `execute()` with a realistic payload; a second run is harmless; failures behave as intended       |
| Frontend code    | See [frontend tests](frontend/references/testing.md): pages, components, route declarations, copy |

## Testing a route

Call the real contribution's `createRouter()` with a container holding test doubles, then issue real requests. This exercises the production factory, including its dependency resolution and middleware:

```ts
const container = new ServiceContainer();
container.instance(authenticationToken, testAuth);

const router = await apiRoutes.createRouter({
  appName: 'main',
  publicBasePath: '/main',
  config: { app: { name: 'main', publicBasePath: '/main' } },
  paths: createAppPaths({ rootDir: '/missing' }),
  router: new Hono(),
  container,
});

const response = await router.request('/orders');
expect(response.status).toBe(401);
```

Do not add a `registerRoutes(router, ...)` helper just to make a route testable. It moves the security boundary out of the thing you are testing.

## Testing the frontend

Component tests, the route test and translation checks are described in [frontend tests](frontend/references/testing.md), including a minimal component test that renders with the real i18n runtime from `@nocobase/i18n/testing`. Do not mock `@nocobase/i18n/client`: a mocked `t` hides misspelt keys and wrong namespaces.

## Testing migrations

Run against a real test database. A test that only imports the migration file proves nothing about the schema it produces. Verify tables, columns, types, indexes, and constraints after `up`, then run `down` and verify cleanup.

## Before finishing

Scope every check to the changed behavior and its affected consumers. Select relevant checks rather than running a fixed full-application checklist after each edit:

| Check               | Scope                                                                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formatting and lint | Pass the changed files to Prettier or ESLint using the project's configuration; include other files only when shared formatting or lint configuration affects them                      |
| Type checking       | Use the smallest owning TypeScript project configuration that covers the change; preserve project references and compiler settings rather than passing individual source files to `tsc` |
| Tests               | Use `pnpm exec vitest run <affected-test-files>` with actual relevant paths; include integration or end-to-end tests for affected behavior across boundaries                            |
| Build               | Build affected packages or supported application targets when emitted output, bundling, or deployment behavior needs verification                                                       |
| Runtime             | Exercise only the affected workflows, including their authentication and permission boundaries when relevant                                                                            |

In a workspace, use `pnpm --filter <affected-package> <script>` for each affected package and affected consumer. For standalone applications, inspect available scripts and project configurations before selecting commands. Do not invent selectors that a command does not support. If a necessary check only supports a whole project or package, use that smallest supported scope and explain the limitation.

Expand scope only when shared code, dependencies, configuration, or a failure gives a concrete reason, or when the user explicitly requests it. Full-application verification is appropriate when the impact actually spans the application. Once checks pass, repeat them only after further relevant changes or to resolve failures. `pnpm check` combines full checks, so use it only when all of its work is warranted by the affected scope.

Add focused regression coverage when behavior changes. Documentation-only changes need formatting and link checks for the changed documents, not type checking, runtime tests, or builds.

Then verify the affected behavior, selecting only the applicable steps below. Green commands mean the code compiles and the assertions you wrote hold — not that the feature works:

- For a frontend change, verify as [the frontend workflow](frontend/ui-workflow.md) prescribes for the workflow it took; a quick change needs only static checks.
- Confirm the endpoint's responses for signed-out, unpermitted, and permitted callers.
- Confirm `pnpm nocobase db apply` applies cleanly.

## Reporting

Say what you ran, what passed, and what you did not run. If you could not verify something — no test database, a flow needing real credentials — say so rather than implying it was checked.

## Strict startup verification

Set `NOCOBASE_STRICT_STARTUP=true` when running `pnpm dev` or `pnpm start` in automated verification. Startup failures, including job import failures, exit nonzero after resource cleanup. Strict dev runs the server without watch mode so a failed server cannot remain hidden behind a watcher; restart the command after server or configuration changes. Client HMR remains available. Omit the variable or set it to `false` for normal development with server hot reload. Request errors and individual job execution failures do not terminate the application.

Use the shared Vitest presets for tests that discover queue jobs. They inline the queue loader so dynamically imported TypeScript tasks use Vitest's transformation and module registry. Do not suppress job import warnings or disable automatic discovery to make a startup test pass; assert that discovered jobs register and execute.

## Vite cache isolation

Every auxiliary Vite server started by a test or auxiliary tool must use its own temporary `cacheDir` and remove it after closing the server. A fixture that symlinks the application's `node_modules` also shares its default `.vite` directory. `optimizeDeps.noDiscovery` and an empty `include` are not isolation: plugins can add optimizer entries. Overwriting the live server's dependency files leaves its in-memory module URLs pointing at missing chunks and breaks lazy pages until restart.

Do not delete or rebuild a running development server's cache. For an already corrupted cache, stop all processes using that application cache before rebuilding it, then reload the browser with its cache disabled if stale dependency responses remain. A separate Vitest configuration does not isolate Vite instances created inside tests or child commands.

## Environment changes during development

`pnpm dev` watches `.env` and `.env.local` with stat polling, including creation, atomic saves, and deletion. Changes stop the current development run before starting a fresh one, so both Vite and the server receive updated ports, base paths, proxy settings, and environment values. Shell variables retain precedence. Use the new ready URL after an address change. Proxy mode restarts Vite; `config.yml` changes restart only the local server. Strict startup disables automatic environment restarts as well as server watching. Never restart with the previous child's resolved environment: deleted dotenv keys would persist.

## Shared application tooling

`@nocobase/app-cli` implements the application's scripts and commands: `pnpm dev`, `pnpm build` and `pnpm start` run `nocobase dev`, `nocobase build` and `nocobase start`, and every standard command is `pnpm nocobase <topic> <command>`. In the source repository, run shared implementation tests in `packages/app/app-cli` and application composition tests in each affected template. Keep tests for the application's own commands in the application. A generated application consumes the compiled package; do not edit installed package files to customize behavior.

Application server source supports extensionless relative imports. Keep `module: "ESNext"`, `moduleResolution: "Bundler"`, and `tsc-alias.resolveFullPaths: true` in `tsconfig.server.json`. Development uses `tsx`; production builds run `tsc-alias` after `tsc` to complete ESM paths, before build hooks collect workflow resources. When changing this configuration, verify the compiled output with plain Node and no source files or TypeScript loader.

Application-owned workflows live in `workflows/` beside `server/` by default. Keep `workflows/**/*.ts` in the server TypeScript build and workflow client directories in the client typecheck. Point ESLint at `tsconfig.server.json` for workflow definitions and handlers so type-aware linting covers the top-level directory. The workflow CLI builds artifacts into `dist/workflows/`; verify this directory when checking a production build.
Vite configuration imports the proxy helpers from `@nocobase/app-cli/dev/proxy`. Watcher, proxy, supervisor and build-step unit tests live in `app-cli`; templates verify their composition and Vite integration.
