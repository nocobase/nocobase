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
| Copy               | Both languages show real text, not keys                                                                                                                                                                                       |

## Writing component tests

- The environment already has `@testing-library/react`, jsdom and the jest-dom assertions set up. Assert what the user can see (text, roles, the result of a click), not the component's internal state.
- When you mock `useApiClient`, share one object across the whole test file; returning a new object on every call makes effects that depend on `api` repeat their requests endlessly.
- To assert a toast, mock `useToaster` the same way, returning one shared `{ show: vi.fn(), close: vi.fn() }`, and assert what `show` was called with: its `type`, `title` and `description`, not how Base UI renders them. A component rendered without a registered toaster still renders; its toasts are logged to the console instead of shown.
- When a button contains a `Spinner`, the spinner's "Loading" label becomes part of the button's name, so use a regular expression when you query by name.
- `tests/` is not covered by any tsconfig, only by ESLint; after writing a test, confirm that it actually runs and passes.
- A Vite server that a test starts itself (including one started by a helper) must use its own temporary `cacheDir`, deleted afterward. Do not delete or rebuild the dependency cache of a running development server; lazily loaded pages then stop working until the server is restarted.

## Running tests

Run only the related test files:

```bash
pnpm exec vitest run <related-test-files>
```
