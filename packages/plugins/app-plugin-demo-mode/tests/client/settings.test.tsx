import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Link, useLocation } from 'react-router';

function LocationProbe() {
  return <output data-testid='location'>{useLocation().search}</output>;
}

import demoMode from '../../client/index.js';
import DemoModeSettings, {
  type DemoSettingsComponents,
} from '../../client/settings/index.js';
import { Button } from '../../client/components/ui/button.js';
import { ScheduleCard } from '../../client/settings/schedule.js';
import * as cards from '../../client/components/ui/card.js';

const hostComponents: DemoSettingsComponents = {
  ...cards,
  Header: ({
    title,
    badge,
    description,
    refreshLabel,
    refreshDisabled,
    refreshing,
    onRefresh,
  }) => (
    <header data-testid='host-header'>
      <h1>
        {title}
        {badge}
      </h1>
      <p>{description}</p>
      <Button disabled={refreshDisabled || refreshing} onClick={onRefresh}>
        {refreshLabel}
      </Button>
    </header>
  ),
  Button: (props) => <Button {...props} data-host-button />,
  Card: (props) => <cards.Card {...props} data-testid='host-card' />,
};
import type { DemoConfigurationView } from '../../shared/configuration.js';

const view = (
  patch: Partial<DemoConfigurationView> = {},
): DemoConfigurationView => ({
  revision: 4,
  collections: [],
  mocks: { 'dataset.model': true },
  schedule: {
    enabled: true,
    hour: 3,
    minute: 0,
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
  },
  chat: { enabled: true, tools: {} },
  busy: false,
  enabled: true,
  fixedCollections: ['session', 'verification'],
  adapters: [
    {
      id: 'dataset.model',
      title: 'Dataset model',
      kind: 'model',
      scope: 'demo-model',
    },
  ],
  nextRun: '2026-10-25T19:00:00.000Z',
  ...patch,
});

const status = {
  available: true,
  datasetId: 'crm',
  languages: ['zh-CN', 'en-US'],
  present: true,
  state: 'ready',
  language: 'zh-CN',
  createdAt: '2026-10-21T08:00:00.000Z',
  finishedAt: '2026-10-21T08:01:00.000Z',
  records: 40,
  counts: { companies: 11, leads: 18 },
  accounts: [
    {
      username: 'liming',
      name: '李明',
      role: '销售经理',
      password: 'liming123',
    },
  ],
  accountsByLanguage: {},
  operation: null,
  importing: null,
  failure: null,
  enabled: true,
  model: { enabled: true, service: 'demo' },
  reset: null,
};

const everything = [
  {
    resource: { type: 'settings', id: 'demoMode.data' },
    actions: ['read', 'manage'],
  },
  {
    resource: { type: 'settings', id: 'demoMode.configuration' },
    actions: ['read', 'configure'],
  },
];

function demoApi({
  enabled = true,
  permissions = everything,
  configuration = view(),
  onRead,
  data = status,
}: {
  data?: typeof status;
  enabled?: boolean;
  permissions?: readonly object[];
  configuration?: ReturnType<typeof view>;
  onRead?: (path: string) => Promise<void>;
} = {}) {
  return answerApi(async (call) => {
    if (call.method === 'GET') await onRead?.(call.path);
    if (call.path === 'authorization/permissions')
      return { data: { unrestricted: false, permissions } };
    if (call.path === 'demoMode/status') return { data: { enabled } };
    if (call.path === 'demoMode/data') return { data };
    if (call.path === 'demoMode/accounts')
      return {
        data: [
          {
            username: 'liming',
            name: '李明',
            role: '销售经理',
            current: false,
          },
        ],
      };
    if (call.method === 'GET' && call.path === 'demoMode/configuration')
      return { data: configuration };
    if (call.method === 'POST' && call.path === 'demoMode/data/clear')
      return {
        data: {
          ...status,
          present: false,
          state: null,
          counts: {},
          accounts: [],
        },
      };
    return new Response(null, { status: 404 });
  });
}

const renderSettings = (
  fetch: ReturnType<typeof demoApi>,
  route = '/',
  onDataChange?: () => void,
  components?: DemoSettingsComponents,
) =>
  renderWithApp(
    <>
      <LocationProbe />
      <Link to='/elsewhere?left=1'>elsewhere</Link>
      <DemoModeSettings
        components={components}
        onDataChange={onDataChange}
        label={(kind, id) =>
          kind === 'count'
            ? { companies: '公司', leads: '线索' }[id]
            : undefined
        }
      />
    </>,
    {
      plugins: [demoMode()],
      fetch,
      locale: 'zh-CN',
      route,
      services: (app) => {
        app.container.singleton(
          authorizationClientToken,
          (resolver) =>
            new AuthorizationClient(resolver.resolve(apiClientToken)),
        );
      },
    },
  );

describe.each(['default', 'host'] as const)(
  'demo settings page (%s)',
  (presentation) => {
    const render = (
      fetch: ReturnType<typeof demoApi>,
      route = '/',
      onDataChange?: () => void,
    ) =>
      renderSettings(
        fetch,
        route,
        onDataChange,
        presentation === 'host' ? hostComponents : undefined,
      );
    it('shows the demo data with the application’s names and how visitors enter', async () => {
      await render(demoApi());
      expect(await screen.findByText('演示环境')).toBeInTheDocument();
      expect(await screen.findByText('公司')).toBeInTheDocument();
      expect(screen.getByText('11')).toBeInTheDocument();
      if (presentation === 'host') {
        expect(screen.getByTestId('host-header')).toBeInTheDocument();
        expect(screen.getAllByTestId('host-card').length).toBeGreaterThan(1);
        expect(screen.getByRole('button', { name: '重置' })).toHaveAttribute(
          'data-host-button',
        );
      }
      expect(screen.getByText('已就绪')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '重置' })).toBeEnabled();
      expect(await screen.findByText('用户名 liming')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '复制 李明 的进入链接' }),
      ).toBeInTheDocument();
      // The data, the daily reset and the accounts share one page.
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.getByText('每日重置')).toBeInTheDocument();
      expect(screen.getByText('03:00')).toBeInTheDocument();
      expect(screen.getByText('Asia/Shanghai')).toBeInTheDocument();
    });

    it('shows the deployment schedule to those who may only read settings', async () => {
      await render(
        demoApi({
          permissions: everything.map((item) => ({
            ...item,
            actions: ['read'],
          })),
        }),
        '/',
      );
      expect(await screen.findByText('03:00')).toBeInTheDocument();
      expect(screen.getByText('Asia/Shanghai')).toBeInTheDocument();
      expect(
        screen.getByText(
          `下次重置：${new Date(view().nextRun!).toLocaleString()}`,
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: '重置' }),
      ).not.toBeInTheDocument();
    });

    it.each(['overview', 'schedule', 'simulation', 'writes'])(
      'opens the whole page for legacy %s tab links',
      async (tab) => {
        await render(demoApi(), `/?tab=${tab}&filter=retained`);
        expect(await screen.findByText('公司')).toBeInTheDocument();
        expect(await screen.findByText('03:00')).toBeInTheDocument();
      },
    );

    it('clears after confirming and tells the application its data changed', async () => {
      const onDataChange = vi.fn();
      await render(demoApi(), '/', onDataChange);
      fireEvent.click(await screen.findByRole('button', { name: '清空' }));
      const dialog = await screen.findByRole('alertdialog');
      expect(
        within(dialog).getByText(/会删除这个实例中的全部业务数据/u),
      ).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole('button', { name: '清空' }));
      await waitFor(() => expect(onDataChange).toHaveBeenCalledTimes(1));
    });

    it('shows a reset as replacing the data, with one progress across its phases', async () => {
      await render(
        demoApi({
          data: {
            ...status,
            present: false,
            state: 'clearing',
            operation: 'reset',
            importing: { percent: 9 },
          } as typeof status,
        }),
      );
      expect(await screen.findByText('重置中')).toBeInTheDocument();
      expect(
        screen.getByText('正在清空现有数据，然后以简体中文重新生成。'),
      ).toBeInTheDocument();
      expect(screen.getByText('清空现有数据')).toBeInTheDocument();
      expect(screen.getByText('9%')).toBeInTheDocument();
      // The counts are of what is being removed, and the actions stay those of existing data.
      expect(screen.queryByText('11')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '重置' })).toBeDisabled();
      expect(
        screen.queryByRole('button', { name: '生成' }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('用户名 liming')).toBeInTheDocument();
    });

    it('explains when the application is not a demo', async () => {
      await render(demoApi({ enabled: false }));
      expect(
        await screen.findByText('这个应用不是演示环境'),
      ).toBeInTheDocument();
    });
  },
);

it('keeps the host refresh pending until both data and configuration settle', async () => {
  let releaseData!: () => void;
  let releaseConfiguration!: () => void;
  const dataGate = new Promise<void>((resolve) => {
    releaseData = resolve;
  });
  const configurationGate = new Promise<void>((resolve) => {
    releaseConfiguration = resolve;
  });
  let dataReads = 0;
  let configurationReads = 0;
  let dataSettled = false;
  await renderSettings(
    demoApi({
      onRead: async (path) => {
        if (path === 'demoMode/data' && ++dataReads > 1) {
          await dataGate;
          dataSettled = true;
        }
        if (path === 'demoMode/configuration' && ++configurationReads > 1)
          await configurationGate;
      },
    }),
    '/',
    undefined,
    hostComponents,
  );
  const refresh = await screen.findByRole('button', { name: '刷新' });
  await waitFor(() => expect(refresh).toBeEnabled());
  fireEvent.click(refresh);
  await waitFor(() => {
    expect(dataReads).toBe(2);
    expect(configurationReads).toBe(2);
  });
  expect(refresh).toBeDisabled();
  releaseData();
  await waitFor(() => expect(dataSettled).toBe(true));
  expect(refresh).toBeDisabled();
  releaseConfiguration();
  await waitFor(() => expect(refresh).toBeEnabled());
});

it('shows the server schedule and next reset in English', async () => {
  const configuration: DemoConfigurationView = {
    ...view(),
    schedule: {
      enabled: true,
      hour: 6,
      minute: 5,
      timezone: 'Europe/London',
      language: 'en-US',
    },
  };
  await renderWithApp(<ScheduleCard configuration={configuration} />, {
    plugins: [demoMode()],
    locale: 'en-US',
  });
  expect(await screen.findByText('Daily reset')).toBeInTheDocument();
  expect(
    screen.getAllByRole('definition').map((item) => item.textContent),
  ).toEqual(['06:05', 'English', 'Europe/London']);
  expect(
    screen.getByText(
      `Next reset: ${new Date(configuration.nextRun!).toLocaleString()}`,
    ),
  ).toBeInTheDocument();
});
