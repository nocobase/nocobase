import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useService: () => ({ watch: () => ({ close: () => {} }) }),
}));
const { default: projects } = await import('../../client/plugin.js');

it('mounts application effects and pages in the same projects query cache', () => {
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
  render(
    <Provider>
      <Page />
    </Provider>,
  );
  expect(effectClient).toBeDefined();
  expect(effectClient).toBe(pageClient);
  effectClient?.clear();
});
