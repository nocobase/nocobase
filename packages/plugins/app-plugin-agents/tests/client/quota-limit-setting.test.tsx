// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { callsTo, clientMocks, resetApi } from './fake-client.js';
import { runner } from './fixtures.js';
import { renderPage } from './render.js';
vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
const { QuotaLimitSetting } =
  await import('../../client/pages/runtimes/quota-limit-setting.js');
afterEach(cleanup);
beforeEach(() =>
  resetApi({
    'PATCH agents/runners/r1': (request) =>
      runner('r1', request.json as object),
  }),
);
it('validates and saves a ceiling, preserving other tools, and can remove it', async () => {
  const data = runner('r1', { canManage: true, quotaLimits: { codex: 90 } });
  const view = renderPage(
    <QuotaLimitSetting runner={data} tool='claude' now={Date.now()} />,
  );
  const input = screen.getByRole('spinbutton');
  fireEvent.change(input, { target: { value: '101' } });
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true);
  fireEvent.change(input, { target: { value: '80' } });
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() =>
    expect(callsTo('PATCH', 'agents/runners/r1')).toHaveLength(1),
  );
  expect(callsTo('PATCH', 'agents/runners/r1')[0]?.json).toEqual({
    quotaLimits: { codex: 90, claude: 80 },
  });
  view.unmount();
  renderPage(
    <QuotaLimitSetting
      runner={{ ...data, quotaLimits: { claude: 80 } }}
      tool='claude'
      now={Date.now()}
    />,
  );
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() =>
    expect(callsTo('PATCH', 'agents/runners/r1')).toHaveLength(2),
  );
  expect(callsTo('PATCH', 'agents/runners/r1')[1]?.json).toEqual({
    quotaLimits: null,
  });
});
it('shows a reached ceiling and keeps settings read only without management permission', () => {
  renderPage(
    <QuotaLimitSetting
      runner={runner('r1', {
        canManage: false,
        quotaLimits: { claude: 80 },
        quotaUsage: [
          {
            tool: 'claude',
            window: 'five_hour',
            scope: 'tool',
            target: '',
            usedPercent: 81,
            resetsAt: null,
            observedAt: new Date().toISOString(),
          },
        ],
      })}
      tool='claude'
      now={Date.now()}
    />,
  );
  expect(screen.getByRole('status').textContent).toContain(
    'runtimes.quota.ceilingReached',
  );
  expect(screen.getByRole('status').getAttribute('data-tone')).toBe('amber');
  expect(screen.getByRole('status').getAttribute('title')).toBe(
    'runtimes.quota.ceilingPaused',
  );
  expect(screen.getByRole('spinbutton').hasAttribute('disabled')).toBe(true);
});
