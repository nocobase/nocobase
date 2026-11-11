import { RouteTreeProvider } from '../../helpers/detail-route-fixture.js';
import { routeKey } from '../../../client/capability-guide/details/route-key.js';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import AgentsOverview from '../../../client/capability-guide/details/agents-overview.js';
import locales from '../../../client/locales/index.js';
import packageMetadata from '../../../package.json' with { type: 'json' };

async function mount() {
  const calls = vi.fn();
  const view = await renderWithApp(<AgentsOverview />, {
    namespace: packageMetadata.name,
    namespaces: { [packageMetadata.name]: locales },
    fetch: answerApi(calls),
  });
  return { ...view, calls };
}
it('does not infer interfaces from plugin registration or fetch private configuration', async () => {
  const { calls } = await mount();
  expect(screen.getAllByText('Not configured')).toHaveLength(5);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(calls).not.toHaveBeenCalled();
});
it('preserves edited requests through tabs, collapse and language changes and copies the visible draft', async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const { app } = await mount();
  const toggle = screen.getByRole('button', {
    name: 'Add AI conversations to a business page',
  });
  await user.click(toggle);
  const input = screen.getByRole('textbox', { name: 'Editable request' });
  await user.clear(input);
  await user.type(input, 'Help our sales team');
  await user.click(screen.getByRole('tab', { name: 'Configuration steps' }));
  expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  await user.click(screen.getByRole('tab', { name: 'Development request' }));
  await user.click(toggle);
  await user.click(toggle);
  await act(async () => {
    await app.runtime.i18n.changeLanguage('zh-CN');
  });
  expect(screen.getByRole('textbox', { name: '可编辑的需求' })).toHaveValue(
    'Help our sales team',
  );
  await user.click(screen.getByRole('button', { name: '复制需求' }));
  expect(copy).toHaveBeenCalledWith('Help our sales team');
});
it('keeps the request editable after clipboard failure', async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('Denied'),
  );
  await mount();
  await user.click(
    screen.getByRole('button', {
      name: 'Add AI conversations to a business page',
    }),
  );
  await user.click(screen.getByRole('button', { name: 'Copy request' }));
  expect(await screen.findByText(/Copy failed/)).toBeVisible();
  expect(
    screen.getByRole('textbox', { name: 'Editable request' }),
  ).toBeEnabled();
});

it.each([false, true])(
  'detects the actual Agent interface and respects access denial (%s)',
  async (denied) => {
    const route = {
      name: 'agents',
      path: '/team/agents',
      componentLoader: async () => ({ default: () => null }),
    } as AppClientRegisteredRoute;
    await renderWithApp(
      <RouteTreeProvider
        routes={[route]}
        access={{
          loading: false,
          denied: new Set(denied ? [routeKey(route)] : []),
        }}
      >
        <AgentsOverview />
      </RouteTreeProvider>,
      {
        namespace: packageMetadata.name,
        namespaces: { [packageMetadata.name]: locales },
      },
    );
    expect(screen.getAllByText('Configured')).toHaveLength(1);
    expect(screen.getAllByText('Not configured')).toHaveLength(4);
    if (denied) expect(screen.queryByRole('link')).not.toBeInTheDocument();
    else
      expect(screen.getByRole('link')).toHaveAttribute('href', '/team/agents');
  },
);
