# Frontend testing

## Where tests go

```text
tests/components/   Component tests (rendering and interaction of pages and components)
tests/logic/        Logic tests (route declarations, pure functions)
```

Tests never go beside the source. Name test files `*.test.ts` or `*.test.tsx`; `vitest.config.ts` discovers `tests/**/*.test.{ts,tsx}` automatically.

## What to test

| What changed       | Test at least                                                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page or component  | What it renders and what happens after an interaction (state changes, submission, error handling)                                                                                                                             |
| Route declarations | `tests/logic/client-routes.test.ts` already checks that every page loads and pins each page's resolved `authz`; when you add a page that requires sign-in, add it to the test's page grant list (see section 12 of `page.md`) |
| Copy               | Both languages show real text, not keys — render with the real i18n runtime (below) rather than a mocked `t`                                                                                                                  |

## Writing component tests

- The environment already has `@testing-library/react`, jsdom and the jest-dom assertions set up. Assert what the user can see (text, roles, the result of a click), not the component's internal state.
- When you mock `useApiClient`, share one object across the whole test file; returning a new object on every call makes effects that depend on `api` repeat their requests endlessly.
- To assert a toast, mock `useToaster` the same way, returning one shared `{ show: vi.fn(), close: vi.fn() }`, and assert what `show` was called with: its `type`, `title` and `description`, not how Base UI renders them. A component rendered without a registered toaster still renders; its toasts are logged to the console instead of shown.
- When a button contains a `Spinner`, the spinner's "Loading" label becomes part of the button's name, so use a regular expression when you query by name.
- `tests/` is not covered by any tsconfig, only by ESLint; after writing a test, confirm that it actually runs and passes.
- A Vite server that a test starts itself (including one started by a helper) must use its own temporary `cacheDir`, deleted afterward. Do not delete or rebuild the dependency cache of a running development server; lazily loaded pages then stop working until the server is restarted.

## A minimal component test

Render with the real i18n runtime and the application's own locale files, a router, and one shared mock of each hook that reaches outside the component. `tests/components/` in the application holds more examples to follow.

```tsx
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';

import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import OrdersPage from '../../client/pages/orders.js';

// One object for the whole file, so effects that depend on `api` do not refetch on every render.
const api = { request: vi.fn() };
const toaster = { show: vi.fn(), close: vi.fn() };
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));

it('creates an order and confirms it', async () => {
  api.request
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ id: 1 });
  const runtime = await createTestI18nRuntime({
    application: { namespace: packageMetadata.name, resources: enUS },
  });

  render(
    <TestI18nProvider runtime={runtime} namespace={packageMetadata.name}>
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    </TestI18nProvider>,
  );
  await userEvent.click(
    await screen.findByRole('button', { name: enUS.orders.create }),
  );

  expect(api.request).toHaveBeenLastCalledWith(
    expect.objectContaining({ path: 'orders:create', method: 'POST' }),
  );
  expect(toaster.show).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'success' }),
  );
});
```

- **Do not mock `@nocobase/i18n/client`.** A mocked `t` returns what the test told it to, so a misspelt key, a key the locale file lacks, or a component reading the wrong namespace all pass. The test runtime is strict: a key missing from the whole fallback chain throws, even when the call passes a `defaultValue`.
- When a strict runtime throws, fix the locale file or the component, not the test. Pass `strict: false` only for strings that are not keys, such as route titles passed through as their own `defaultValue`.
- Omit `namespace` on `TestI18nProvider` for a component a plugin exports for the application to render, so the test proves the component names its own namespace.
- To check a second language, pass the `client/locales/index.ts` loader map instead of a resource and call `runtime.changeLanguage('zh-CN')` inside `act`.

`packages/libs/i18n/README.md` in the `@nocobase/i18n` package documents every option.

## Running tests

Run only the related test files:

```bash
pnpm exec vitest run <related-test-files>
```
