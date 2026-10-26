# A runnable internal package

This example supports one application at the workspace root, with private shared packages below `packages/`. It does not establish a general multi-application monorepo workflow. Custom workspace patterns are preserved during creation and upgrades, but the automatic internal-source watches and template package checks target `packages/`; a different layout needs its own watching and checks.

Run the [example creator](../scripts/create-internal-package.mjs) from an installed application root:

```bash
node .agents/skills/nocobase-app-development/scripts/create-internal-package.mjs
```

It creates `packages/shared` and refuses to overwrite it. The generated package includes `src/index.ts`, a behavior test, `tsconfig.json`, ESLint and Vitest configurations, ignore files, and `build`, `dev:types`, `typecheck`, `lint`, `format`, `test`, `check` and `fix` scripts. Tooling dependencies use the application's installed versions, including `@nocobase/dev-config`; no registry lookup chooses unrelated newer versions. The sample has no Node-only runtime imports, so its `greet` function and `Greeting` type work in both application halves. Adapt the package name and behavior to the application after trying it.

Ensure `pnpm-workspace.yaml` includes `packages/*`, retaining its other settings. Add `"@my-app/shared": "workspace:*"` to the application's `dependencies` for this shared server/client example. A client-only package belongs in `devDependencies`. Then run:

```bash
pnpm install
pnpm --filter @my-app/shared fix
pnpm --filter @my-app/shared build
pnpm check:packages
```

Import by package name from either `client/` or `server/`:

```ts
import { greet, type Greeting } from '@my-app/shared';

const greeting: Greeting = greet('Ada');
```

Use `greeting.message` in the feature that consumes it; keep user-visible application copy in the application's translations. The package exports `src/index.ts` at development runtime and `dist/index.d.ts` to TypeScript. Its `publishConfig.exports` directs deployment imports to `dist/index.js`; it remains private and needs no publishing or plugin registration.

## Keep declarations current

Build once before the application's first standalone typecheck. During development, run this in a separate terminal alongside `pnpm dev`:

```bash
pnpm --filter @my-app/shared dev:types
```

Vite and tsx read the changed source immediately, while application typechecking reads the generated declarations. Without the declaration watcher, changing an exported type can leave the editor and `pnpm typecheck` checking the previous API even though the runtime uses the new code. Wait for the watcher to finish without errors before checking consumers; a failed emit can leave older declarations on disk. With several packages, start their declaration watchers and build dependencies in order before the first consumer check. Packages using compiled runtime exports need a full `tsc --watch` build instead of declaration-only emission.

Restart `pnpm dev` after adding a package or changing workspace dependencies, because the server's explicit watch set is calculated at startup. `pnpm build` builds workspace dependencies before typechecking and bundling the application; the one-shot deployment build does not need these watchers.

## Verify the consuming application

Run `pnpm check:packages` and the application's scoped checks after wiring in the imports. The template check reports any selected internal package without a non-empty `check` script before running any package checks; an empty `packages/` layout succeeds. To verify a changed exported type, add a required field to `Greeting`, update `greet`, wait for declaration generation, and confirm an application assignment that omits the new field fails typechecking. Repair the consumer before continuing.

For runtime acceptance, exercise a real frontend use and server response before and after editing `greet`, then build with `pnpm build --tar` and run the extracted archive outside the source workspace with the original sources unavailable. Verify the consuming feature there as well as the health endpoint. Follow the deployment Skill for configuration and database isolation; a successful health response alone cannot prove the internal package was included.
