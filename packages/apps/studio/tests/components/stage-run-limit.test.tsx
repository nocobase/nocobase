import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useContext, useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import {
  RunAgentEditor,
  RunAgentSummary,
} from '../../client/agents/stage-rule-editors.js';
import { IssueStageRunLimit } from '../../client/issues/detail/stage-run-limit.js';
import { AgentWorkflowRules } from '../../client/agents/workflow-rules.js';
import {
  STAGE_RUN_LIMIT,
  STAGE_RUN_WINDOW_HOURS,
} from '../../shared/stage-run-limit.js';
import { StatusRuleTypesContext } from '@nocobase/app-plugin-projects/client/kit';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  show: vi.fn(),
  viewer: { userId: 'alice' },
  editable: true,
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: mocks.request }),
  useToaster: () => ({ show: mocks.show }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async () => {
  const React = await import('react');
  return {
    StatusRuleTypesContext: React.createContext([]),
    useViewer: () => mocks.viewer,
    PmExpandableTextarea: (props: Record<string, unknown>) => (
      <textarea {...props} />
    ),
  };
});
vi.mock('@nocobase/app-plugin-projects/client/issues', () => ({
  canEditIssues: () => mocks.editable,
}));
vi.mock('@nocobase/app-plugin-agents/client/kit', () => ({
  useAgentOptions: () => ({ agents: [], nameOf: () => null, failed: false }),
}));
vi.mock('../../client/components/agent-picker', () => ({
  AgentPicker: () => <div />,
}));

const issue = {
  id: 'i1',
  ownerUserId: 'alice',
  statusKey: 'in_progress',
  revision: 1,
} as IssueDetail;
const pending = {
  token: 'token',
  statusKey: 'in_progress',
  maxRuns: 5,
  windowHours: 12,
};
beforeEach(() => {
  mocks.viewer = { userId: 'alice' };
  mocks.editable = true;
  mocks.request.mockReset();
  mocks.show.mockReset();
});
afterEach(cleanup);

async function mount(
  children: ReactNode,
  language: 'en-US' | 'zh-CN' = 'en-US',
) {
  const runtime = await createTestI18nRuntime({
    application: {
      namespace: 'studio',
      resources: language === 'en-US' ? enUS : zhCN,
    },
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </TestI18nProvider>,
  );
}

describe('stage run configuration', () => {
  it.each(['en-US', 'zh-CN'] as const)(
    'edits numeric limits and removes blank optional values in %s',
    async (language) => {
      const changed = vi.fn();
      function Editor() {
        const [config, setConfig] = useState<Record<string, unknown>>({});
        return (
          <RunAgentEditor
            config={config}
            idPrefix='rule'
            onChange={(next) => {
              setConfig(next);
              changed(next);
            }}
          />
        );
      }
      await mount(<Editor />, language);
      const words = (language === 'en-US' ? enUS : zhCN).studioAgents
        .stageRules;
      const runs = screen.getByLabelText(
        words.maxRuns.replace('{{maxRuns}}', String(STAGE_RUN_LIMIT)),
      );
      const hours = screen.getByLabelText(
        words.windowHours.replace(
          '{{windowHours}}',
          String(STAGE_RUN_WINDOW_HOURS),
        ),
      );
      expect(runs).toHaveValue(null);
      expect(hours).toHaveValue(null);
      expect(runs).not.toHaveAttribute('placeholder');
      expect(hours).not.toHaveAttribute('placeholder');
      fireEvent.change(runs, { target: { value: '5' } });
      fireEvent.change(hours, { target: { value: '12' } });
      expect(changed).toHaveBeenLastCalledWith({ maxRuns: 5, windowHours: 12 });
      fireEvent.change(runs, { target: { value: '' } });
      expect(changed).toHaveBeenLastCalledWith({ windowHours: 12 });
      fireEvent.change(hours, { target: { value: '' } });
      expect(changed).toHaveBeenLastCalledWith({});
      const hint = words.limitHint
        .replace('{{maxRuns}}', String(STAGE_RUN_LIMIT))
        .replace('{{windowHours}}', String(STAGE_RUN_WINDOW_HOURS));
      expect(screen.getByText(hint)).toBeInTheDocument();
    },
  );
  it('describes configured limits', async () => {
    await mount(<RunAgentSummary config={{ maxRuns: 5, windowHours: 12 }} />);
    expect(
      screen.getByText(/Up to 5 agent-driven runs in 12 hours/u),
    ).toBeInTheDocument();
  });
  it.each(['en-US', 'zh-CN'] as const)(
    'shows shared defaults in the summary in %s',
    async (language) => {
      await mount(<RunAgentSummary config={{}} />, language);
      const words = (
        language === 'en-US' ? enUS : zhCN
      ).studioAgents.stageRules.withLimit
        .replace(
          '{{summary}}',
          language === 'en-US' ? 'Runs the issue’s agent' : '运行任务的 Agent',
        )
        .replace('{{maxRuns}}', String(STAGE_RUN_LIMIT))
        .replace('{{windowHours}}', String(STAGE_RUN_WINDOW_HOURS));
      expect(screen.getByText(words)).toBeInTheDocument();
    },
  );
  it.each(['en-US', 'zh-CN'] as const)(
    'interpolates the default limit in the add-rule hint in %s',
    async (language) => {
      function RuleHint() {
        const rules = useContext(StatusRuleTypesContext);
        return (
          <span>
            {
              rules.find((rule: { type: string }) => rule.type === 'runAgent')
                ?.hint
            }
          </span>
        );
      }
      await mount(
        <AgentWorkflowRules>
          <RuleHint />
        </AgentWorkflowRules>,
        language,
      );
      const expected = (
        language === 'en-US' ? enUS : zhCN
      ).studioAgents.stageRules.runAgentHint
        .replace('{{maxRuns}}', String(STAGE_RUN_LIMIT))
        .replace('{{windowHours}}', String(STAGE_RUN_WINDOW_HOURS));
      expect(screen.getByText(expected)).toBeInTheDocument();
      expect(screen.queryByText(/\{\{(?:maxRuns|windowHours)\}\}/u)).toBeNull();
    },
  );
});

describe('continuing a stage run', () => {
  it('submits once, disables while pending, and removes the action after success', async () => {
    let complete!: (value: unknown) => void;
    const posted = new Promise((resolve) => {
      complete = resolve;
    });
    let current: typeof pending | null = pending;
    mocks.request.mockImplementation((request: { method?: string }) =>
      request.method === 'POST' ? posted : Promise.resolve({ data: current }),
    );
    const continued = vi.fn();
    await mount(<IssueStageRunLimit issue={issue} onContinued={continued} />);
    const button = await screen.findByRole('button', { name: 'Continue' });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    expect(
      mocks.request.mock.calls.filter(([request]) => request.method === 'POST'),
    ).toHaveLength(1);
    expect(mocks.request).toHaveBeenLastCalledWith({
      method: 'POST',
      path: 'issueStageRuns/i1/continue',
      json: { token: 'token' },
    });
    current = null;
    complete({ data: { runId: 'r1' } });
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Continue' }),
      ).not.toBeInTheDocument(),
    );
    expect(continued).toHaveBeenCalledOnce();
  });
  it('keeps the action after a failed request and gives localized feedback', async () => {
    mocks.request.mockImplementation((request: { method?: string }) =>
      request.method === 'POST'
        ? Promise.reject(new Error('Connection failed'))
        : Promise.resolve({ data: pending }),
    );
    await mount(<IssueStageRunLimit issue={issue} />, 'zh-CN');
    fireEvent.click(await screen.findByRole('button', { name: '继续' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '继续' })).not.toBeDisabled(),
    );
    expect(mocks.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: zhCN.studioAgents.stageRules.continueFailed,
      }),
    );
  });
  it('hides the action from a person who may not edit issues', async () => {
    mocks.editable = false;
    await mount(<IssueStageRunLimit issue={issue} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
