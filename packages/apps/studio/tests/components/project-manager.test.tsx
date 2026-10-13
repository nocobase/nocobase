/**
 * The Agent page's project manager: the section over the discovered agents (who it runs with, its principles, the
 * comment run limit) and its settings dialog (first choice and fallback, the principles with "Restore built-in", the
 * limit), read-only for whoever may not manage agents.
 */
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import type { ProjectManagerView } from '../../shared/project-manager.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  show: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: mocks.request }),
  useToaster: () => ({ show: mocks.show }),
}));
vi.mock('@nocobase/app-plugin-agents/client/kit', () => ({
  RunnerAgentsSection: () => <section>discovered agents</section>,
}));

const { default: AgentsPage } = await import('../../client/pages/agents/index');
const { default: ProjectManagerSettingsPage } =
  await import('../../client/agents/project-manager/settings-dialog');

const BUILT_IN = '## Who does what\n- Reviews: another vendor';
const view = (overrides: Partial<ProjectManagerView> = {}) =>
  ({
    firstChoiceAgentId: 'opus',
    fallbackAgentId: 'astra',
    principles: null,
    commentRunLimit: 20,
    fallbackAfterSeconds: 120,
    delegationQueueTimeoutSeconds: 600,
    builtInPrinciples: BUILT_IN,
    choices: [
      {
        id: 'opus',
        name: 'Claude · Opus 5.5',
        description: null,
        online: true,
      },
      {
        id: 'astra',
        name: 'Codex · GPT-6 Astra',
        description: null,
        online: false,
      },
      {
        id: 'sol',
        name: 'Codex · GPT-6.1 Sol',
        description: null,
        online: true,
      },
    ],
    canEdit: true,
    ...overrides,
  }) satisfies ProjectManagerView;

let current = view();
beforeEach(() => {
  current = view();
  mocks.show.mockReset();
  mocks.request.mockReset();
  mocks.request.mockImplementation(
    (request: { method?: string; json?: Partial<ProjectManagerView> }) => {
      if (request.method === 'PATCH')
        current = {
          ...current,
          ...request.json,
        } as ProjectManagerView;
      return Promise.resolve({ data: current });
    },
  );
});
afterEach(cleanup);

async function show(path: string, language: 'en-US' | 'zh-CN' = 'en-US') {
  const runtime = await createTestI18nRuntime({
    application: {
      namespace: 'studio',
      resources: language === 'en-US' ? enUS : zhCN,
    },
    locale: language,
  });
  render(
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path='/agents' element={<AgentsPage />}>
              <Route
                path='project-manager'
                element={<ProjectManagerSettingsPage />}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
}

describe('the project manager section', () => {
  it('says who it runs with, its principles and limit, above the discovered agents', async () => {
    await show('/agents', 'zh-CN');
    const section = await screen.findByTestId('project-manager-section');
    expect(section).toHaveTextContent('项目经理');
    expect(
      await within(section).findByText('Claude · Opus 5.5'),
    ).toBeInTheDocument();
    expect(section).toHaveTextContent('备选');
    expect(section).toHaveTextContent('Codex · GPT-6 Astra');
    expect(
      within(section).getByRole('img', { name: '暂无执行机' }),
    ).toBeTruthy();
    expect(section).toHaveTextContent('内置');
    expect(section).toHaveTextContent('每个任务每 24 小时 20 次');
    expect(within(section).getByText('设置').closest('a')).toHaveAttribute(
      'href',
      '/agents/project-manager',
    );
    const sections = [...document.querySelectorAll('section')];
    expect(sections.at(-1)).toHaveTextContent('discovered agents');
  });

  it('says when its principles are customized', async () => {
    current = view({ principles: 'Only Opus writes code.' });
    await show('/agents');
    expect(await screen.findByText('Customized')).toBeInTheDocument();
  });
});

describe('the project manager settings', () => {
  it('chooses the agents, restores the built-in principles and saves them as built-in', async () => {
    current = view({ principles: 'Only Opus writes code.' });
    await show('/agents/project-manager');
    const principles = await screen.findByLabelText('Allocation principles', {
      selector: 'textarea',
    });
    expect(principles).toHaveValue('Only Opus writes code.');
    fireEvent.click(screen.getByRole('button', { name: 'Restore built-in' }));
    expect(principles).toHaveValue(BUILT_IN);

    // The fallback offers no fallback and every agent but the first choice.
    await userEvent.click(document.getElementById('pm-fallback')!);
    const list = await screen.findByRole('listbox');
    expect(
      within(list)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['No fallback', 'Codex · GPT-6 Astra', 'Codex · GPT-6.1 Sol']);
    await userEvent.click(
      within(list).getByRole('option', { name: 'No fallback' }),
    );

    fireEvent.change(screen.getByLabelText('Comment run limit'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith({
        path: 'projectManager',
        method: 'PATCH',
        json: {
          firstChoiceAgentId: 'opus',
          fallbackAgentId: null,
          principles: null,
          commentRunLimit: 30,
          fallbackAfterSeconds: 120,
          delegationQueueTimeoutSeconds: 600,
        },
      }),
    );
  });

  it('refuses a limit out of range', async () => {
    await show('/agents/project-manager');
    const limit = await screen.findByLabelText('Comment run limit');
    fireEvent.change(limit, { target: { value: '0' } });
    expect(
      screen.getByText('Enter a whole number from 1 to 1000.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('is read-only for whoever may not manage agents', async () => {
    current = view({ canEdit: false });
    await show('/agents/project-manager');
    expect(
      await screen.findByText(
        'Only a manager of agents may change these settings.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Allocation principles', { selector: 'textarea' }),
    ).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Restore built-in' }),
    ).toBeNull();
  });
});
