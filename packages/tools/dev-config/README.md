# @nocobase/dev-config

Shared, ESM-only development configuration for the NocoBase monorepo and
independently installed NocoBase packages. The package provides stable subpath
exports for TypeScript, ESLint, Prettier, Vitest, and application Vite configuration.

This package is publish-ready but is not published as part of the initial
monorepo migration.

## Installation

Install this package as a development dependency together with the runners used
by your project:

```sh
pnpm add -D @nocobase/dev-config typescript eslint prettier
```

Install optional peers only for the presets that need them. For example, a
React application using the shared Vitest and Vite factories also needs Vitest,
Vite, React Testing Library, JSDOM, and the React and Tailwind Vite plugins.

Node.js 24 or newer is required to run the development tooling.

## Source and published output

All executable configuration source in this package is TypeScript. `pnpm build`
compiles the public runtime entries to ESM JavaScript and declarations under
`dist`; package exports always point to that compiled output. Consumers install
and use the package normally and do not compile TypeScript from `node_modules`.

The JSON TypeScript presets remain directly exported because `tsconfig`
inheritance reads them as data. The workspace root `prepare` script makes the
compiled entries available after a monorepo install, and this package's
`prepack` rebuilds them before creating the npm tarball.

## Configuration map

| Concern    | Export                         | Use it for                                    |
| ---------- | ------------------------------ | --------------------------------------------- |
| TypeScript | `tsconfig/base.json`           | Common strict checking only                   |
| TypeScript | `tsconfig/client.json`         | Browser or React applications                 |
| TypeScript | `tsconfig/client-library.json` | Browser libraries that emit declarations      |
| TypeScript | `tsconfig/server.json`         | Node applications that emit JavaScript        |
| TypeScript | `tsconfig/server-library.json` | Node libraries that emit declarations         |
| TypeScript | `tsconfig/node-tooling.json`   | Vite, Vitest, and build scripts               |
| ESLint     | `eslint`                       | Composable flat-config segments and factories |
| Prettier   | `prettier`                     | The repository formatting baseline            |
| Vitest     | `vitest/node`                  | Node test projects                            |
| Vitest     | `vitest/react`                 | React and JSDOM test projects                 |
| Vite       | `vite/app`                     | NocoBase applications                         |

## Quick start

Extend a TypeScript preset while keeping directory-specific fields local:

```json
{
  "extends": "@nocobase/dev-config/tsconfig/server-library.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Create a thin ESLint configuration:

```js
import { createNodeLibraryConfig } from '@nocobase/dev-config/eslint';

export default createNodeLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: ['fixtures/generated/**'],
});
```

Environment-neutral libraries use `createUniversalLibraryConfig` so their
runtime source does not implicitly receive Node, browser, or React globals.

Use the shared formatter directly from `prettier.config.js`:

```js
export { default } from '@nocobase/dev-config/prettier';
```

Each configuration area has a dedicated README with its supported overrides
and examples.

When changing this package, run:

```sh
pnpm --filter @nocobase/dev-config check
```

## Version policy

Subpath exports are public API. Adding an optional preset is a minor release;
implementation fixes that do not add diagnostics are patches; new default
errors, semantic TypeScript changes, and removed or renamed exports are major
changes.

## Database task build manifests

Run `nocobase-db-manifests [source-database-dir] [output-database-dir]` after compiling database migrations and seeds and after rewriting JavaScript imports. The defaults are `database` and `dist/database`. The command traverses connection directories and seals each `migrations` or `seeds` directory with a versioned `.manifest.json`. It does not import or execute task modules. Missing outputs, output files without a source, colliding output names, and sources newer than their outputs fail the build; compile from a stable source tree and clean removed output files before rebuilding.

Build scripts can instead import `generateDatabaseManifests` from `@nocobase/dev-config/build/database-manifests` and call it with absolute `sourceDir` and `outputDir`. A task's manifest entry records `sourceChecksum` (SHA-256 of source text) and `artifactChecksum` (SHA-256 of final JavaScript, including the appended manifest marker). The marker tells the database loader that the JavaScript requires a manifest; handwritten JavaScript without a manifest keeps its content checksum. Source files are never changed. Generated manifests contain no timestamps or absolute paths and are replaced rather than merged on each build.

The manifest detects inconsistent or modified artifacts, not malicious replacement of both the artifact and its manifest: it is build metadata, not a digital signature. Include it in packed and deployed output. A source map describes the original emitted lines; the marker is appended after those lines.
