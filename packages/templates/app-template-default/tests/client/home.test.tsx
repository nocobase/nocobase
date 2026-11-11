import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
  type AuthorizationSnapshot,
} from '@nocobase/app-plugin-authorization/client';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import HomePage from '../../client/pages/home/index.js';
import {
  CAPABILITY_GUIDE_PATH,
  capabilityPath,
  createCapabilityCatalog,
  entryContent,
  format,
  guideContent,
} from '@nocobase/app-plugin-foundation/capability-guide';

const catalog = createCapabilityCatalog(packageMetadata);
const escape = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const granted: AuthorizationSnapshot = {
  unrestricted: false,
  permissions: [
    { resource: { type: 'page', id: 'capability-guide' }, actions: ['access'] },
  ],
};

function renderHome(
  permissions: () =>
    AuthorizationSnapshot | Promise<AuthorizationSnapshot> = () => granted,
) {
  return renderWithApp(<HomePage />, {
    namespace: packageMetadata.name,
    namespaces: { [packageMetadata.name]: enUS },
    fetch: answerApi(async ({ path }) =>
      path === 'authorization/permissions'
        ? { data: await permissions() }
        : new Response(null, { status: 404 }),
    ),
    services: (app) => {
      app.container.singleton(
        authorizationClientToken,
        (resolver) => new AuthorizationClient(resolver.resolve(apiClientToken)),
      );
    },
  });
}

const writeText = vi.fn<(text: string) => Promise<void>>();
const clipboard = { fail: false };

/** `userEvent.setup()` installs a clipboard stub of its own, so the mock goes in after it. */
function setup(): ReturnType<typeof userEvent.setup> {
  const user = userEvent.setup();
  writeText
    .mockReset()
    .mockImplementation(() =>
      clipboard.fail ? Promise.reject(new Error('denied')) : Promise.resolve(),
    );
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return user;
}

describe('home page', () => {
  beforeEach(() => {
    clipboard.fail = false;
  });

  it('tells people to build by asking their coding agent', async () => {
    await renderHome();

    expect(
      screen.getByRole('heading', { level: 1, name: enUS.home.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(enUS.home.steps.describe.title)).toBeVisible();
  });

  it('features capabilities from the shared guide catalog, each linking to its entry', async () => {
    await renderHome();
    const content = guideContent('en-US');

    expect(catalog.featured.length).toBeGreaterThan(0);
    for (const entry of catalog.featured) {
      const title = entryContent(content, entry).title;
      expect(
        await screen.findByRole('link', { name: new RegExp(escape(title)) }),
      ).toHaveAttribute('href', capabilityPath(entry.id));
    }
  });

  it('leads to the full catalog, counted from the dependencies this application declares', async () => {
    await renderHome();
    const content = guideContent('en-US');

    expect(
      await screen.findByRole('link', {
        name: format(content.home.viewAll, { count: catalog.entries.length }),
      }),
    ).toHaveAttribute('href', CAPABILITY_GUIDE_PATH);
  });

  it.each<AuthorizationSnapshot>([
    { unrestricted: true, permissions: [] },
    {
      unrestricted: false,
      permissions: [
        { resource: { type: 'page', id: '*' }, actions: ['access'] },
      ],
    },
  ])(
    'keeps catalog links for unrestricted and wildcard grants: %j',
    async (snapshot) => {
      await renderHome(() => snapshot);
      expect(
        await screen.findByRole('link', {
          name: format(guideContent('en-US').home.viewAll, {
            count: catalog.entries.length,
          }),
        }),
      ).toHaveAttribute('href', CAPABILITY_GUIDE_PATH);
    },
  );

  it('keeps descriptions without links while permissions load, after denial and after revocation', async () => {
    const pending = Promise.withResolvers<AuthorizationSnapshot>();
    let permissions: AuthorizationSnapshot | Promise<AuthorizationSnapshot> =
      pending.promise;
    const { app } = await renderHome(() => permissions);
    const authorization = app.container.resolve(authorizationClientToken);
    const content = guideContent('en-US');
    const expectDescriptionsOnly = () => {
      expect(screen.queryAllByRole('link')).toHaveLength(0);
      expect(screen.queryByText(content.home.open)).not.toBeInTheDocument();
      for (const entry of catalog.featured) {
        const text = entryContent(content, entry);
        expect(screen.getByText(text.title)).toBeVisible();
        expect(screen.getByText(text.summary)).toBeVisible();
      }
    };
    expectDescriptionsOnly();
    await act(async () => {
      pending.resolve({ unrestricted: false, permissions: [] });
      await authorization.snapshot();
    });
    expectDescriptionsOnly();
    await act(async () => {
      permissions = granted;
      authorization.invalidate();
      await authorization.snapshot();
    });
    expect(
      await screen.findByRole('link', {
        name: format(content.home.viewAll, { count: catalog.entries.length }),
      }),
    ).toHaveAttribute('href', CAPABILITY_GUIDE_PATH);
    await act(async () => {
      permissions = { unrestricted: false, permissions: [] };
      authorization.invalidate();
      await authorization.snapshot();
    });
    expectDescriptionsOnly();
  });

  it('reports a copy the browser refuses', async () => {
    clipboard.fail = true;
    const user = setup();
    const view = await renderHome();

    await user.click(
      screen.getAllByRole('button', { name: enUS.home.prompt.copy })[0],
    );

    expect(view.toasts()).toEqual([
      expect.objectContaining({
        type: 'error',
        title: enUS.home.prompt.copyFailed,
      }),
    ]);
  });
});
