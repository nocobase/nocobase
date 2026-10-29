import { realtimeClientToken } from '@nocobase/app-client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';

import projects from '../../client/plugin.js';

it('mounts application effects and pages in the same projects query cache', async () => {
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
  const Provider = projects({ routes: false, queryEffects: Effects })
    .reactProviders[0]!.component;
  await renderWithApp(
    <Provider>
      <Page />
    </Provider>,
    {
      services: (app) => {
        vi.spyOn(
          app.container.resolve(realtimeClientToken),
          'watch',
        ).mockReturnValue({
          state: 'subscribed',
          error: undefined,
          retry: () => {},
          close: () => {},
        });
      },
    },
  );
  expect(effectClient).toBeDefined();
  expect(effectClient).toBe(pageClient);
  effectClient?.clear();
});
