import type {
  AppClientRegisteredRoute,
  AppClientRouteComponentModule,
} from '@nocobase/app-client/plugins';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ClientRoute } from '../../client/routing/client-route.tsx';

vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: true, isPending: false }),
}));

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

const healthyModule: AppClientRouteComponentModule = {
  default: () => <h2>Recovered page</h2>,
};

describe('client route loading recovery', () => {
  it('clears a previous failure when the same mounted route loads successfully', async () => {
    const { rerender } = render(<ClientRoute route={route} />);
    expect(await screen.findByText('Unable to load page')).toBeVisible();

    rerender(
      <ClientRoute
        route={{ ...route, componentLoader: async () => healthyModule }}
      />,
    );

    expect(await screen.findByText('Recovered page')).toBeVisible();
    expect(screen.queryByText('Unable to load page')).not.toBeInTheDocument();
  });

  it('ignores a superseded loader failure after the replacement succeeds', async () => {
    let rejectLoad!: (error: Error) => void;
    const pending = new Promise<AppClientRouteComponentModule>(
      (_resolve, reject) => {
        rejectLoad = reject;
      },
    );
    const { rerender } = render(
      <ClientRoute route={{ ...route, componentLoader: () => pending }} />,
    );
    rerender(
      <ClientRoute
        route={{ ...route, componentLoader: async () => healthyModule }}
      />,
    );
    expect(await screen.findByText('Recovered page')).toBeVisible();

    await act(async () => {
      rejectLoad(new Error('Stale failure'));
      await pending.catch(() => undefined);
    });
    expect(screen.getByText('Recovered page')).toBeVisible();
    expect(screen.queryByText('Unable to load page')).not.toBeInTheDocument();
  });
});
