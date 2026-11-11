import type {
  AppClientRegisteredRoute,
  AppClientRouteComponentModule,
} from '@nocobase/app-client/plugins';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Activity, useState } from 'react';
import { describe, expect, it } from 'vitest';

import { ClientRoute } from '../../client/routing/client-route.tsx';

import { renderWithApp } from '@nocobase/app-testing/client';
import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';

const options = {
  namespace: packageMetadata.name,
  namespaces: { [packageMetadata.name]: enUS },
  services(app: import('@nocobase/app-client').ClientApplication) {
    app.container.singleton(
      authorizationClientToken,
      (resolver) => new AuthorizationClient(resolver.resolve(apiClientToken)),
    );
  },
};

const route: AppClientRegisteredRoute = {
  id: 'recoverable',
  name: 'recoverable',
  path: '/recoverable',
  auth: 'required',
  authz: 'skip',
  packageName: 'test',
  source: 'application',
  componentLoader: async () => {
    throw new Error('Module unavailable');
  },
};

// Loading a lazy route and rendering its error boundary can take longer than Testing Library's one-second default on
// a loaded CI runner. A page that never renders still fails, well inside the 30-second test timeout.
const ROUTE_LOAD_TIMEOUT = { timeout: 10_000 };

const healthyModule: AppClientRouteComponentModule = {
  default: () => <h2>Recovered page</h2>,
};

describe('client route loading recovery', () => {
  it('keeps a loaded wrapped component when an ancestor Activity reconnects its effects', async () => {
    let loads = 0;
    const componentLoader = async () => {
      loads += 1;
      return {
        default: function Editor() {
          const [draft, setDraft] = useState('');
          return (
            <input
              aria-label='Draft'
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          );
        },
      };
    };
    const definition = { ...route, componentLoader };
    const view = (hidden: boolean) => (
      <Activity mode={hidden ? 'hidden' : 'visible'}>
        <ClientRoute route={definition} />
      </Activity>
    );
    const { rerender } = await renderWithApp(view(false), options);
    const input = await screen.findByRole(
      'textbox',
      { name: 'Draft' },
      ROUTE_LOAD_TIMEOUT,
    );
    fireEvent.change(input, { target: { value: 'Keep this draft' } });
    rerender(view(true));
    await waitFor(() => expect(input).not.toBeVisible());
    rerender(view(false));
    await waitFor(() => expect(input).toBeVisible());
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(input);
    expect(input).toHaveValue('Keep this draft');
    expect(loads).toBe(1);
  });

  it('loads a replacement after a successful module and ignores a superseded successful response', async () => {
    const pending = Promise.withResolvers<AppClientRouteComponentModule>();
    const { rerender } = await renderWithApp(
      <ClientRoute
        route={{ ...route, componentLoader: async () => healthyModule }}
      />,
      options,
    );
    await screen.findByText('Recovered page', {}, ROUTE_LOAD_TIMEOUT);
    rerender(
      <ClientRoute
        route={{ ...route, componentLoader: () => pending.promise }}
      />,
    );
    const replacement = { default: () => <h2>Replacement page</h2> };
    rerender(
      <ClientRoute
        route={{ ...route, componentLoader: async () => replacement }}
      />,
    );
    await screen.findByText('Replacement page', {}, ROUTE_LOAD_TIMEOUT);
    await act(async () =>
      pending.resolve({ default: () => <h2>Stale page</h2> }),
    );
    expect(screen.getByText('Replacement page')).toBeVisible();
    expect(screen.queryByText('Stale page')).toBeNull();
  });

  it('invokes the same loader again on retry after a failed attempt', async () => {
    let loads = 0;
    const componentLoader = async () => {
      loads += 1;
      if (loads === 1) throw new Error('Temporary failure');
      return healthyModule;
    };
    await renderWithApp(
      <ClientRoute route={{ ...route, componentLoader }} />,
      options,
    );
    fireEvent.click(
      await screen.findByRole(
        'button',
        { name: 'Retry', exact: true },
        ROUTE_LOAD_TIMEOUT,
      ),
    );
    expect(
      await screen.findByText('Recovered page', {}, ROUTE_LOAD_TIMEOUT),
    ).toBeVisible();
    expect(loads).toBe(2);
  });

  it('clears a previous failure when the same mounted route loads successfully', async () => {
    const { rerender } = await renderWithApp(
      <ClientRoute route={route} />,
      options,
    );
    expect(
      await screen.findByText('Unable to load page', {}, ROUTE_LOAD_TIMEOUT),
    ).toBeVisible();

    rerender(
      <ClientRoute
        route={{ ...route, componentLoader: async () => healthyModule }}
      />,
    );

    expect(
      await screen.findByText('Recovered page', {}, ROUTE_LOAD_TIMEOUT),
    ).toBeVisible();
    expect(screen.queryByText('Unable to load page')).not.toBeInTheDocument();
  });

  it('ignores a superseded loader failure after the replacement succeeds', async () => {
    let rejectLoad!: (error: Error) => void;
    const pending = new Promise<AppClientRouteComponentModule>(
      (_resolve, reject) => {
        rejectLoad = reject;
      },
    );
    const { rerender } = await renderWithApp(
      <ClientRoute route={{ ...route, componentLoader: () => pending }} />,
      options,
    );
    rerender(
      <ClientRoute
        route={{ ...route, componentLoader: async () => healthyModule }}
      />,
    );
    expect(
      await screen.findByText('Recovered page', {}, ROUTE_LOAD_TIMEOUT),
    ).toBeVisible();

    await act(async () => {
      rejectLoad(new Error('Stale failure'));
      await pending.catch(() => undefined);
    });
    expect(screen.getByText('Recovered page')).toBeVisible();
    expect(screen.queryByText('Unable to load page')).not.toBeInTheDocument();
  });
});
