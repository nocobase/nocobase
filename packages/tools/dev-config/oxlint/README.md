# Oxlint presets

Install `@nocobase/dev-config`, `oxlint`, `oxlint-tsgolint`, and `eslint` as development dependencies. Use the catalog versions in a NocoBase workspace. The preset uses Oxlint's native TypeScript rules with tsgolint. Oxlint's JS plugin host runs the existing `@eslint-react` rules, selector-based restrictions, and a few compatibility rules that need ESLint's rule definitions. Oxlint runs the React Hooks checks with fixed React Compiler options and gating disabled.

The pinned Linux x64 GNU build of Oxlint requires AVX2 and BMI2. For Linux x64 virtual machines, use a CPU model that exposes both features. An older CPU model can terminate Oxlint with `SIGILL` before it reports any lint results.

Create an `oxlint.config.ts` at the package root.

```ts
import { createApplicationConfig } from '@nocobase/dev-config/oxlint';

export default createApplicationConfig({
  ignores: ['storage/**'],
  nodeTestFiles: ['scripts/smoke/**/*.test.mjs'],
});
```

Use `oxlint --type-aware --deny-warnings` for `lint` and add `--fix` for `lint:fix`. Both commands accept file and directory arguments. For example, `pnpm lint client/routes.ts` checks one file in a generated application. Prettier still formats the source.

- `createApplicationConfig` scopes React and browser rules to application source, and applies the shadcn/ui exceptions.
- `createNodeLibraryConfig` enables Node globals. `createUniversalLibraryConfig` uses only ECMAScript globals.
- `createClientLibraryConfig` applies React and browser rules and uses Node globals for tooling. Include `...createShadcnRegistryConfig('website')` in `overrides` when that directory contains registry output.
- `rules` augments the shared rules and `overrides` applies file-specific options afterwards. The exported `react` and `node` overrides can be re-scoped to additional client or server entry points.
- `nodeTestFiles` extends the Vitest exclusion for `tests/build/**/*.test.mjs`. These files still receive syntax lint. Type-aware rules apply to TypeScript sources and keep the preset's test and tooling exceptions.

Existing ESLint directives for native rules, including `@typescript-eslint`, `react-hooks`, and `react-refresh`, are recognized. Use `nocobase/no-restricted-syntax` for a directive that targets a selector-based restriction. Declare extra globals in the relevant configuration override.

The `@nocobase/dev-config/eslint` export remains available for packages on ESLint.
