# Vitest factories

Use the Node factory for server packages:

```js
import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';

export default createNodeVitestConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

Use the React factory for browser components:

```js
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

export default createReactVitestConfig({
  resolve: {
    alias: {
      '@': new URL('./client', import.meta.url).pathname,
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
```

The React factory installs the React Vite plugin, uses JSDOM, loads
`@testing-library/jest-dom/vitest`, and runs Testing Library `cleanup` after
every test. Local setup files are merged with the shared setup.

It also inlines `@refinedev/react-router`. Loaded by Node, Refine's router bindings get a different copy of `react-router` than the test and the application import, so an application rendered under a test's `MemoryRouter` fails with "useLocation() may be used only in the context of a <Router> component". A local `server.deps.inline` list is merged with this one.

Both factories set `testTimeout` and `hookTimeout` to 30 seconds, well above
Vitest's 5-second default. CI runs every package's suite in parallel on one
shared runner, so a test that finishes in well under a second locally can take
several seconds there, and the default turns ordinary growth into a timeout
failure. A package that needs a different value sets its own `testTimeout`,
which takes precedence over the shared one.

Aliases, include patterns, coverage provider and output, thresholds, and other
package-specific behavior stay in the local configuration. The shared presets
do not impose coverage thresholds.
