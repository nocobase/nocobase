# Client example: submit, retry and prevent duplicate requests

Use `renderWithApp()` for a component that consumes NocoBase client services. It starts a client application, provides a memory router, the real API client, strict translations and a test toaster. `answerApi()` supplies the HTTP responses, so no backend or database is required for this example.

This complete example assumes a NocoBase 3 application with its normal React, TypeScript and test dependencies installed. It uses `@nocobase/app-testing/client`, `@nocobase/app-client`, `@nocobase/i18n`, `@nocobase/dev-config`, Vitest, jsdom, Testing Library, user-event and jest-dom.

## Configure client tests

Create `vitest.client.config.ts` at the application root. The shared React preset provides jsdom, JSX transformation, jest-dom assertions and DOM cleanup after each test. An application that already has a client Vitest project can use that project instead. Discover both `.test.ts` and `.test.tsx` files; retain Vitest's default file parallelism for client-only suites, while keeping cases that share one DOM sequential.

```ts
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

export default createReactVitestConfig({
  cacheDir: './storage/tests/vite-client',
  test: {
    include: ['tests/client/**/*.test.{ts,tsx}'],
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

The sample API contract is `POST /api/testingNotes` with `{ title }`, returning status `201` with `{ data: { id, title } }`. The test supplies this response; adding a real backend route is separate feature work.

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
const createdNote = { data: { id: 'note-1', title } };
const expectedCall: ApiCall = {
  method: 'POST',
  path: 'testingNotes',
  json: { title },
};
const translations = {
  'en-US': enUS.testingNotes,
  'zh-CN': zhCN.testingNotes,
};
const localeCases = ['en-US', 'zh-CN'] as const;

async function renderCreateNote(
  respond: () => Response | Promise<Response>,
  locale: keyof typeof translations = 'en-US',
) {
  const user = userEvent.setup();
  const handler = vi.fn((call: ApiCall) => {
    if (call.method !== 'POST' || call.path !== 'testingNotes') {
      return new Response(null, { status: 404 });
    }
    return respond();
  });
  const view = await renderWithApp(<CreateNoteButton title={title} />, {
    namespace: packageMetadata.name,
    namespaces: { [packageMetadata.name]: locales },
    locale,
    fetch: answerApi(handler),
  });
  const copy = translations[locale];
  const button = screen.getByRole('button', { name: copy.create });
  return { user, handler, view, copy, button };
}

it.each(localeCases)('submits a note and confirms it in %s', async (locale) => {
  const { user, handler, view, copy, button } = await renderCreateNote(
    () => Response.json(createdNote, { status: 201 }),
    locale,
  );

  await user.click(button);

  await waitFor(() => {
    expect(view.toasts()).toMatchObject([
      { type: 'success', title: copy.created },
    ]);
    expect(button).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  expect(handler.mock.calls).toEqual([[expectedCall]]);
});

it.each(localeCases)(
  'shows a failure and retries successfully in %s',
  async (locale) => {
    const retry = Promise.withResolvers<Response>();
    const respond = vi
      .fn<() => Response | Promise<Response>>()
      .mockReturnValueOnce(new Response(null, { status: 500 }))
      .mockReturnValue(retry.promise);
    const { user, handler, view, copy, button } = await renderCreateNote(
      respond,
      locale,
    );

    try {
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(copy.failed);
        expect(button).toBeEnabled();
        expect(view.toasts()).toEqual([]);
      });

      await user.click(button);

      expect(button).toBeDisabled();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(view.toasts()).toEqual([]);
    } finally {
      await act(async () => {
        retry.resolve(Response.json(createdNote, { status: 201 }));
      });
    }

    await waitFor(() => {
      expect(view.toasts()).toMatchObject([
        { type: 'success', title: copy.created },
      ]);
      expect(button).toBeEnabled();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(handler.mock.calls).toEqual([[expectedCall], [expectedCall]]);
  },
);

it('prevents a duplicate request while submitting', async () => {
  const response = Promise.withResolvers<Response>();
  const { user, handler, view, copy, button } = await renderCreateNote(
    () => response.promise,
  );

  try {
    await user.click(button);

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1);
    });
    expect(button).toBeDisabled();
    expect(view.toasts()).toEqual([]);

    await user.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => {
      response.resolve(Response.json(createdNote, { status: 201 }));
    });
  }

  await waitFor(() => {
    expect(view.toasts()).toMatchObject([
      { type: 'success', title: copy.created },
    ]);
    expect(button).toBeEnabled();
  });
  expect(handler.mock.calls).toEqual([[expectedCall]]);
});
```

The two success cases check the complete request and confirmation in English and Chinese. Two retry cases check the translated failure message, then hold the retry pending to verify that the old error clears immediately, the button disables and no success appears before the response. The final case verifies that a second click during submission cannot send another request.

`renderCreateNote()` is a local setup helper for this component. Each call creates its own user-event session, request spy and client application; assertions and response timing stay in the test. Keep the helper local until another test actually needs the same setup.

The request spy records every call before matching the method and path. Unexpected endpoints return `404`; `handler.mock.calls` checks the exact request history, including payloads and duplicates. Keep those assertions outside `answerApi()`: it converts a thrown assertion into an HTTP 500, which an error-state test could mistake for its intended failure.

Wait for the final toast and enabled button together, because the success callback and `finally` complete separate parts of the interaction. Perform clicks outside `waitFor()`, whose callback may run repeatedly. Use `Promise.withResolvers<Response>()` to control pending requests without timers, and resolve them inside `act()` in `finally` so even a failing assertion releases the request before fixture cleanup.

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

Expect one test file and five passing cases. These checks cover client interaction, API request construction and translations. Use the [server example](../server/routes.md) for permissions and persistence.

Return to [testing and verification](../../testing.md).
