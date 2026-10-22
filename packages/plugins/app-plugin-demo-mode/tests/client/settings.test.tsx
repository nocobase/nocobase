import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import demoMode from '../../client/index.js';
import DemoModeSettings from '../../client/settings/index.js';
import type { DemoConfigurationView } from '../../server/configuration/types.js';

const view = (patch: Partial<DemoConfigurationView> = {}) => ({
  revision: 4,
  rules: [],
  tables: [],
  mocks: { 'dataset.model': true },
  schedule: null,
  chat: { enabled: false, model: null, tools: {} },
  busy: false,
  mode: 'read-only',
  fixedTables: ['session', 'verification'],
  capabilities: [
    {
      id: 'crm.leads',
      title: 'Leads',
      table: 'crm_leads',
      operations: ['insert', 'update'],
      scopes: [
        { id: 'demo', title: 'Demo records' },
        { id: 'all', title: 'All records' },
      ],
    },
  ],
  adapters: [
    {
      id: 'dataset.model',
      title: 'Dataset model',
      kind: 'model',
      scope: 'demo-model',
    },
  ],
  nextRun: null,
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
  importing: null,
  failure: null,
  mode: 'read-only',
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
  mode = 'read-only',
  permissions = everything,
  configuration = view(),
  onPut,
}: {
  mode?: string;
  permissions?: readonly object[];
  configuration?: ReturnType<typeof view>;
  onPut?: (call: ApiCall) => unknown;
} = {}) {
  return answerApi((call) => {
    if (call.path === 'authorization/permissions')
      return { data: { unrestricted: false, permissions } };
    if (call.path === 'demoMode/status') return { data: { mode } };
    if (call.path === 'demoMode/data') return { data: status };
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
    if (call.path === 'demoMode/configuration/tables')
      return { data: ['crm_user_preferences'] };
    if (call.method === 'GET' && call.path === 'demoMode/configuration')
      return { data: configuration };
    if (call.method === 'PUT' && onPut) return onPut(call);
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

const render = (
  fetch: ReturnType<typeof demoApi>,
  route = '/',
  onDataChange?: () => void,
) =>
  renderWithApp(
    <DemoModeSettings
      onDataChange={onDataChange}
      label={(kind, id) =>
        kind === 'count' ? { companies: '公司', leads: '线索' }[id] : undefined
      }
    />,
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

describe('demo settings page', () => {
  it('shows the demo data with the application’s names and how visitors enter', async () => {
    await render(demoApi());
    expect(await screen.findByText('演示环境')).toBeInTheDocument();
    expect(await screen.findByText('公司')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('已就绪')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置' })).toBeEnabled();
    expect(
      await screen.findByText('用户名 liming · 密码 liming123'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '复制 李明 的进入链接' }),
    ).toBeInTheDocument();
  });

  it('saves the daily reset with the revision it started from, after confirming', async () => {
    const puts: ApiCall[] = [];
    await render(
      demoApi({
        onPut: (call) => {
          puts.push(call);
          return {
            data: view({
              revision: 5,
              schedule: (call.json as { value: never }).value,
            }),
          };
        },
      }),
      '/?tab=schedule',
    );
    fireEvent.click(await screen.findByRole('switch', { name: '每天重置' }));
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('保存每日重置？')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: '确认修改' }));
    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0]).toMatchObject({
      path: 'demoMode/configuration/schedule',
      json: {
        expectedRevision: 4,
        value: { enabled: true, hour: 3, minute: 0, language: 'zh-CN' },
      },
    });
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
  });

  it('says when another administrator saved first', async () => {
    await render(
      demoApi({
        onPut: () =>
          Response.json(
            {
              error: {
                status: 'ABORTED',
                reason: 'DEMO_CONFIGURATION_CONFLICT',
                domain: 'demoMode',
                message: 'Conflict',
              },
            },
            { status: 409 },
          ),
      }),
      '/?tab=writes',
    );
    fireEvent.click(await screen.findByRole('switch', { name: '新建' }));
    const card = screen
      .getByText('业务操作')
      .closest('[data-slot="card"]') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: '保存' }));
    fireEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: '确认修改',
      }),
    );
    expect(
      await screen.findAllByText('其他管理员先保存了这项设置。'),
    ).not.toHaveLength(0);
  });

  it('shows settings without save buttons to those who may only read them', async () => {
    await render(
      demoApi({
        permissions: everything.map((item) => ({
          ...item,
          actions: ['read'],
        })),
      }),
      '/?tab=simulation',
    );
    expect(await screen.findByText('在线聊天')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: '允许访客聊天' }),
    ).toHaveAttribute('data-disabled');
    expect(
      screen.queryByRole('button', { name: '保存' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: '概览' }));
    expect(
      screen.queryByRole('button', { name: '重置' }),
    ).not.toBeInTheDocument();
  });

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

  it('explains when the application is not a demo', async () => {
    await render(demoApi({ mode: 'off' }));
    expect(await screen.findByText('这个应用不是演示环境')).toBeInTheDocument();
  });
});
