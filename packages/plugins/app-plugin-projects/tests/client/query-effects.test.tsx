import { realtimeClientToken } from '@nocobase/app-client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';

import projects from '../../client/plugin.js';

it.each([undefined, false])(
  'mounts effects in the page cache with realtime=%s',
  async (realtime) => {
    let effectClient: QueryClient | undefined;
    let pageClient: QueryClient | undefined;
    function Effects() {
      effectClient = useQueryClient();
      return null;
    }
    function Page() {
      pageClient = useQueryClient();
      return <span>Work page</span>;
    }
    const watch = vi
      .fn()
      .mockReturnValue({
        state: 'subscribed',
        error: undefined,
        retry: () => {},
        close: () => {},
      });
    const Provider = projects({
      routes: false,
      realtime,
      queryEffects: Effects,
    }).reactProviders[0]!.component;
    await renderWithApp(
      <Provider>
        <Page />
      </Provider>,
      {
        services: (app) => {
          vi.spyOn(
            app.container.resolve(realtimeClientToken),
            'watch',
          ).mockImplementation(watch);
        },
      },
    );
    expect(watch).toHaveBeenCalledTimes(realtime === false ? 0 : 1);
    expect(effectClient).toBeDefined();
    expect(effectClient).toBe(pageClient);
    effectClient?.clear();
  },
);
