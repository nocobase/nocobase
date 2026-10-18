# Client example: submit, retry and prevent duplicate requests

Use `renderWithApp()` for a component that consumes NocoBase client services. It starts a client application, provides a memory router, the real API client, strict translations and a test toaster. `answerApi()` supplies the HTTP responses, so no backend or database is required for this example.

This complete example assumes a NocoBase 3 application with its normal React, TypeScript and test dependencies installed. It uses `@nocobase/app-testing/client`, `@nocobase/app-client`, `@nocobase/i18n`, `@nocobase/dev-config`, Vitest, jsdom, Testing Library, user-event and jest-dom.

## Configure client tests

Create `vitest.client.config.ts` at the application root. The shared React preset provides jsdom, JSX transformation, jest-dom assertions and DOM cleanup after each test. An application that already has a client Vitest project can use that project instead.

```ts
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

export default createReactVitestConfig({
  cacheDir: './storage/tests/vite-client',
  test: {
    include: ['tests/client/**/*.test.tsx'],
    fileParallelism: false,
    passWithNoTests: false,
  },
});
```

## Prepare the component and translations

Create `client/components/create-note-button.tsx`. The component submits a title, disables its button while the request is pending, and reports success or an error. In feature work, import the real component instead of reproducing its implementation inside a test.

```tsx
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';

export function CreateNoteButton({
  title,
}: {
  readonly title: string;
}): ReactElement {
  const api = useApiClient();
  const toaster = useToaster();
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  function createNote(): void {
    setPending(true);
    setFailed(false);
    api
      .request({
        path: 'testingNotes',
        method: 'POST',
        json: { title },
      })
      .then(() => {
        toaster.show({ type: 'success', title: t('testingNotes.created') });
      })
      .catch(() => {
        setFailed(true);
      })
      .finally(() => {
        setPending(false);
      });
  }

  return (
    <>
      <button type='button' disabled={pending} onClick={createNote}>
        {t('testingNotes.create')}
      </button>
      {failed ? <p role='alert'>{t('testingNotes.failed')}</p> : null}
    </>
  );
}
```

Add the following translations. If these files already exist, merge the `testingNotes` keys into their default exports and preserve the other keys.

`client/locales/en-US.ts`:

```ts
export default {
  testingNotes: {
    create: 'Create note',
    created: 'Note created',
    failed: 'Could not create the note. Try again.',
  },
};
```

`client/locales/zh-CN.ts`:

```ts
export default {
  testingNotes: {
    create: '创建笔记',
    created: '笔记已创建',
    failed: '无法创建笔记，请重试。',
  },
};
```

`client/locales/index.ts`:

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};

export default locales;
```

The sample API contract is `POST /api/testingNotes` with `{ title }`, returning `{ data: { id, title } }`. The test supplies this response; adding a real backend route is separate feature work.

## Test submission, failure, retry and pending state

Create `tests/client/create-note.test.tsx`:

```tsx
import '@testing-library/jest-dom/vitest';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { CreateNoteButton } from '../../client/components/create-note-button.js';
import enUS from '../../client/locales/en-US.js';
import locales from '../../client/locales/index.js';
import zhCN from '../../client/locales/zh-CN.js';
import packageMetadata from '../../package.json' with { type: 'json' };

const title = 'Review invoice';
const appOptions = {
  namespace: packageMetadata.name,
  namespaces: { [packageMetadata.name]: locales },
  locale: 'en-US',
};

it.each([
  { locale: 'en-US', copy: enUS.testingNotes },
  { locale: 'zh-CN', copy: zhCN.testingNotes },
])('submits a note and confirms it in $locale', async ({ locale, copy }) => {
  const user = userEvent.setup();
  const handler = vi.fn(() => ({ data: { id: 'note-1', title } }));
  const view = await renderWithApp(<CreateNoteButton title={title} />, {
    ...appOptions,
    locale,
    fetch: answerApi(handler),
  });

  await user.click(screen.getByRole('button', { name: copy.create }));

  await waitFor(() => {
    expect(view.toasts()).toMatchObject([
      { type: 'success', title: copy.created },
    ]);
  });
  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler).toHaveBeenCalledWith({
    method: 'POST',
    path: 'testingNotes',
    json: { title },
  });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('shows a failed request and allows retrying successfully', async () => {
  const user = userEvent.setup();
  const handler = vi
    .fn<(call: ApiCall) => unknown>()
    .mockReturnValueOnce(new Response(null, { status: 500 }))
    .mockReturnValue({ data: { id: 'note-1', title } });
  const view = await renderWithApp(<CreateNoteButton title={title} />, {
    ...appOptions,
    fetch: answerApi(handler),
  });
  const button = screen.getByRole('button', { name: enUS.testingNotes.create });

  await user.click(button);

  expect(await screen.findByRole('alert')).toHaveTextContent(
    enUS.testingNotes.failed,
  );
  expect(view.toasts()).toEqual([]);
  expect(button).toBeEnabled();

  await user.click(button);

  await waitFor(() => {
    expect(view.toasts()).toMatchObject([
      { type: 'success', title: enUS.testingNotes.created },
    ]);
  });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(handler).toHaveBeenCalledTimes(2);
  expect(handler).toHaveBeenNthCalledWith(2, {
    method: 'POST',
    path: 'testingNotes',
    json: { title },
  });
  expect(button).toBeEnabled();
});

it('disables the button while submitting and prevents a duplicate request', async () => {
  const user = userEvent.setup();
  const response = Promise.withResolvers<unknown>();
  const handler = vi.fn(() => response.promise);
  const view = await renderWithApp(<CreateNoteButton title={title} />, {
    ...appOptions,
    fetch: answerApi(handler),
  });
  const button = screen.getByRole('button', { name: enUS.testingNotes.create });

  await user.click(button);
  expect(button).toBeDisabled();
  expect(view.toasts()).toEqual([]);

  await user.click(button);
  expect(handler).toHaveBeenCalledTimes(1);

  await act(async () => {
    response.resolve({ data: { id: 'note-1', title } });
  });

  await waitFor(() => {
    expect(button).toBeEnabled();
    expect(view.toasts()).toMatchObject([
      { type: 'success', title: enUS.testingNotes.created },
    ]);
  });
});
```

The first two cases verify the request payload and success notification in English and Chinese. The third checks that an HTTP 500 displays an error, allows another attempt, clears the error after a successful retry and then reports success. The final case holds the response pending to verify that the button stays disabled and another click cannot send a second request; it releases the response explicitly instead of waiting for a timer.

The application namespace and locale loaders are real. Missing translation keys fail the test. For a plugin-owned page, pass its registration in `plugins` and its package name in `namespace`; for a page that needs other services, include the registrations it actually consumes. `renderWithApp()` shuts down its client application when each test finishes.

## Adapt the harness to the page

| The page needs                      | Supply or assert                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Application-owned translations      | `namespace: packageMetadata.name` and `namespaces: { [packageMetadata.name]: locales }`                                |
| A plugin's services or translations | Its actual registration in `plugins` and the owning namespace; include the dependencies its provider needs             |
| A starting client URL               | `route`; it sets the memory router's initial entry                                                                     |
| Several API operations              | Branch in `answerApi()` on `method`, `path`, `query` or `json`; return an explicit error response for unexpected calls |
| A domain error                      | Return a `Response` with the real API's status and error envelope so the component exercises its error handling        |
| A service double                    | Register it in `services` before startup and omit the plugin that would register the same token                        |
| An existing in-process test server  | Supply `server: testApp` and, after real sign-in, `cookie: session.cookie`; close the server with its owning fixture   |

`answerApi()` receives paths below `/api/`, such as `testingNotes`, while server request helpers accept `/users`. An object returned by the handler is sent as JSON with status `200`; return a `Response` to select another status, including `201` or `500`. A thrown handler error becomes a `500` response. The test's `vi.fn()` observes the HTTP boundary; keep `useApiClient()`, `useTranslation()` and `useToaster()` real.

Call `renderWithApp()` inside the test rather than `beforeAll`: it registers shutdown with Vitest's `onTestFinished`. The shared React preset unmounts the DOM after each test. Do not disable strict translations to hide a missing key, and do not replace the installed router configuration with a second router wrapper. Client tests cover component interactions and requests; permissions and persistence need the real [server fixture](../server/routes.md).

## Run and check

Run from the application root:

```bash
pnpm exec vitest run --config vitest.client.config.ts --reporter=verbose
```

Expect one test file and four passing cases. These checks cover client interaction, API request construction and translations. Use the [server example](../server/routes.md) for permissions and persistence.

Return to [testing and verification](../../testing.md).
