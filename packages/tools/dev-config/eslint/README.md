# ESLint flat config

The ESLint export uses ESLint 10 flat config, `@eslint/js`,
`typescript-eslint` recommended type-checked rules with project service,
`@eslint-react`, React Hooks, React Refresh, Vitest, and
`eslint-config-prettier`.

## Factories

- `createUniversalLibraryConfig` applies only standard ECMAScript globals to
  environment-neutral source files.
- `createNodeLibraryConfig` applies Node globals to source files.
- `createClientLibraryConfig` applies browser and React rules, with Node globals
  for scripts and configuration files.
- `createApplicationConfig` scopes browser and React rules to `client`, `registry`,
  and tests, and scopes Node globals to `server`, scripts, and config files. It
  also relaxes the rules shadcn/ui registry output trips over, for the registry
  paths alone; see below.

All factories accept:

- `tsconfigRootDir`: the package directory used by TypeScript project service;
- `ignores`: additional global ignore patterns;
- `rules`: local rules applied after the shared rules;
- `overrides`: flat-config objects applied after local rules;
- `environment`: additional environment config objects.

```js
import { createApplicationConfig } from '@nocobase/dev-config/eslint';

export default createApplicationConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: ['public/vendor/**'],
  overrides: [
    {
      files: ['scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
});
```

Pass `import.meta.dirname` from each package. Project service then discovers the
nearest local tsconfig without a cross-package project glob.

## Composable segments

Advanced configurations can compose the exported `base`, `typescript`,
`typeChecked`, `node`, `react`, and `vitest` arrays. `typeChecked` is the
default in the factories; use `typescript` only when type-aware linting is
intentionally unavailable.

The shared global ignores cover build output, coverage, generated content, and
test artifacts. React and Vitest rules are scoped to their relevant files.

## shadcn/ui registry output

`createApplicationConfig` relaxes a short list of rules for
`client/components/ui/**/*.tsx` and `client/hooks/use-mobile.ts`, and a few more
for `client/components/ui/chart.tsx`.

The list comes from `createShadcnRegistryConfig(root)`, which scopes the same blocks to `<root>/components/ui/` and `<root>/hooks/` and defaults `root` to `client`. A package whose primitives live elsewhere passes its own directory rather than copying the rules, so it keeps up with the list; the UI Library, whose primitives live in `website/`, uses `environment: createShadcnRegistryConfig('website')`.

Those files are not written by hand. `shadcn add` copies them from the upstream
registry verbatim, and `shadcn add <name> --diff` only stays meaningful while
the local copy matches. The primitives export their `cva` variants, contexts and
hooks beside the component by design, and a few compose state the way the
upstream source does, so rules such as `react-refresh/only-export-components`
report on a shape nobody here chose and whose only available fix is the edit
that destroys the diff.

The relaxation is the factory's rather than each application's because every
application adds registry components eventually, including the ones generated
from the templates — each would otherwise discover the same failure and write the
same exception. Everything outside those paths, `client/components/` included,
is held to the full rule set.
