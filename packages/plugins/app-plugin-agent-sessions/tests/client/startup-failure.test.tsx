import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';

import plugin from '../../client/plugin.js';
import { AgentSessionsConfigContext } from '../../client/config.js';
import { ComputersDialog } from '../../client/components/computers-dialog.js';
import { NewSession } from '../../client/components/new-session.js';
import type { Computer } from '../../shared/api.js';

const detail =
  'Command: /usr/bin/node /managed/adapter/dist/index.js\nAgent exited\nlast stderr line';
const computer: Computer = {
  id: 'failure',
  name: 'Test workstation',
  platform: 'linux',
  arch: 'x64',
  host: 'test',
  home: '/workspace',
  roots: ['/workspace'],
  folders: ['/workspace'],
  defaultFolders: true,
  online: true,
  choices: {},
  commands: {},
  lastSeenAt: '2026-10-18T08:00:00Z',
  createdAt: '2026-10-18T08:00:00Z',
  agents: [
    {
      id: 'claude',
      name: 'Claude Code',
      version: null,
      problem: 'failed',
      detail,
    },
  ],
};

beforeEach(() => localStorage.clear());

it.each([
  { locale: 'en-US', mixed: false },
  { locale: 'zh-CN', mixed: false },
  { locale: 'en-US', mixed: true },
  { locale: 'zh-CN', mixed: true },
])(
  'shows failure output in both views with a usable agent: $mixed ($locale)',
  async ({ locale, mixed }) => {
    const shown = await renderWithApp(
      <QueryClientProvider client={new QueryClient()}>
        <AgentSessionsConfigContext.Provider
          value={{ cli: 'nb-studio', connectPrompt: null, linkPanels: {} }}
        >
          <ComputersDialog open onOpenChange={() => {}} />
          <NewSession />
        </AgentSessionsConfigContext.Provider>
      </QueryClientProvider>,
      {
        plugins: [plugin({ routes: false })],
        namespace: '@nocobase/app-plugin-agent-sessions',
        locale,
        fetch: answerApi(({ path }) =>
          path === 'agentSessions/computers'
            ? {
                data: [
                  {
                    ...computer,
                    agents: [
                      ...computer.agents,
                      ...(mixed
                        ? [{ id: 'codex', name: 'Codex', version: 'test' }]
                        : []),
                    ],
                  },
                ],
                meta: { total: 1 },
              }
            : { data: [], meta: {} },
        ),
      },
    );
    const failures = await screen.findAllByText(
      /Command: \/usr\/bin\/node \/managed\/adapter\/dist\/index.js.*last stderr line/u,
    );
    expect(failures).toHaveLength(2);
    for (const failure of failures) {
      expect(failure).toBeVisible();
      expect(failure).toHaveClass('whitespace-pre-wrap');
    }
    expect(
      screen.getAllByText(
        locale === 'zh-CN'
          ? '保持连接时，桥会每分钟自动重新检测 Agent。'
          : 'While connected, the bridge automatically checks agents again every minute.',
      ),
    ).toHaveLength(2);
    if (mixed) {
      expect(screen.getByRole('textbox', { hidden: true })).toBeInTheDocument();
      expect(
        screen.queryByText(
          locale === 'zh-CN'
            ? '这台电脑上还没有可用的 Agent'
            : 'No agent is ready on this computer',
        ),
      ).not.toBeInTheDocument();
    }
    shown.unmount();
  },
);
