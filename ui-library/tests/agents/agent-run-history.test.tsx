import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  RunAttempts,
  RunExecutionBadge,
  RunHeader,
  AgentRunHistory,
  type AgentRunExecution,
  type AgentRunHistoryRun,
} from '../../registry/agents/agent-run-history.js';

const execution: AgentRunExecution = {
  attempt: 1,
  runnerId: 'r1',
  runnerName: 'dev-1',
  runnerOwnerName: 'Alice',
  tool: 'codex',
  toolVersion: '1.2.3',
  model: null,
  actualModels: ['actual-model'],
  effort: 'high',
};
const run: AgentRunHistoryRun = {
  id: 'run1',
  agentId: 'coder',
  agentName: 'Coder',
  status: 'completed',
  createdAt: '2026-10-08T00:00:00Z',
  startedAt: '2026-10-08T00:00:01Z',
  finishedAt: '2026-10-08T00:01:00Z',
  executions: [execution],
};

describe('run execution display', () => {
  it('shows runtime, owner, tool version, actual default model and effort in the header and list', () => {
    const { unmount } = render(<RunHeader run={run} />);
    expect(screen.getByTestId('run-execution')).toHaveTextContent(
      'dev-1 · owned by Alice · codex 1.2.3 · Legacy default (actual: actual-model) · Requested reasoning: high · Actual reasoning not reported',
    );
    unmount();
    render(<AgentRunHistory runs={[run]} />);
    expect(screen.getByTestId('run-execution')).toHaveTextContent(
      'Legacy default (actual: actual-model)',
    );
  });

  it('shows each attempt separately and marks a runtime change', () => {
    render(
      <RunAttempts
        executions={[
          execution,
          {
            ...execution,
            attempt: 2,
            runnerId: 'r2',
            runnerName: 'dev-2',
            actualModels: ['second-model'],
          },
        ]}
      />,
    );
    expect(screen.getByText('Attempt 1')).toBeVisible();
    expect(screen.getByText('Attempt 2')).toBeVisible();
    expect(screen.getByText('Runtime changed')).toBeVisible();
    expect(screen.getAllByTestId('run-execution')[1]).toHaveTextContent(
      'dev-2',
    );
    expect(screen.getAllByTestId('run-execution')[1]).toHaveTextContent(
      'second-model',
    );
  });

  it('opens the originating run from its short badge while keeping a real link', () => {
    const open = vi.fn();
    render(
      <RunExecutionBadge
        execution={execution}
        href='/issues/1?run=run1'
        onOpen={open}
      />,
    );
    const link = screen.getByRole('link', { name: 'dev-1 · actual-model' });
    expect(link).toHaveAttribute('href', '/issues/1?run=run1');
    fireEvent.click(link);
    expect(open).toHaveBeenCalledOnce();
    fireEvent.click(link, { ctrlKey: true });
    expect(open).toHaveBeenCalledOnce();
  });

  it('distinguishes a requested model from multiple reported models and supports translated labels', () => {
    render(
      <RunHeader
        run={{
          ...run,
          execution: {
            ...execution,
            model: 'requested',
            actualModels: ['one', 'two'],
          },
        }}
        labels={{
          title: '执行记录',
          empty: '无',
          status: {
            queued: '排队',
            dispatched: '启动',
            running: '运行',
            completed: '完成',
            failed: '失败',
            cancelled: '取消',
            stopping: '停止中',
          },
          activity: {
            queued: '',
            dispatched: '',
            running: '',
            completed: '',
            failed: '',
            cancelled: '',
          },
          live: { working: '', workingFor: '', queued: '' },
          viewTranscript: '',
          stop: '',
          retry: '',
          viewAll: '',
          allTitle: '',
          filterAgent: '',
          filterStatus: '',
          allAgents: '',
          allStatuses: '',
          noMatch: '',
          execution: {
            unknownRunner: '未知执行机',
            unknownModel: '未知模型',
            defaultModel: '默认模型',
            defaultActual: '默认（实际：{model}）',
            specifiedActual: '{requested}（实际：{model}）',
            owner: '{name} 的执行机',
            defaultEffort: '默认思考强度',
            effort: '请求思考强度：{effort}',
            actualEffort: '实际思考强度：{effort}',
            unreportedEffort: '实际值未报告',
            effortSource: '来源：{source}',
            effortChangedAt: '变化时间：{at}',
            attempt: '第 {attempt} 次尝试',
            changedRunner: '执行机已更换',
          },
        }}
      />,
    );
    expect(screen.getByTestId('run-execution')).toHaveTextContent(
      'requested（实际：one, two）',
    );
    expect(screen.getByTestId('run-execution')).toHaveTextContent(
      'Alice 的执行机',
    );
  });

  it('does not present requested values as actual values and hides machine identifiers', () => {
    const unknown = {
      ...execution,
      model: 'requested',
      actualModels: [],
      machineHidden: true,
    };
    const { unmount } = render(<RunExecutionBadge execution={unknown} />);
    expect(
      screen.getByText('Team runtime · Actual model not reported'),
    ).toBeVisible();
    expect(screen.queryByText(/requested|dev-1|Alice|r1/)).toBeNull();
    unmount();
    render(<RunHeader run={{ ...run, executions: [unknown] }} />);
    expect(screen.getByTestId('run-execution')).toHaveTextContent(
      'Requested model: requested (actual: Actual model not reported)',
    );
    expect(screen.getByTestId('run-execution')).toHaveTextContent(
      'Requested reasoning: high · Actual reasoning not reported',
    );
  });

  it('labels requested and reported values even when they match, with report source and change time', () => {
    render(
      <RunHeader
        run={{
          ...run,
          execution: {
            ...execution,
            model: 'actual-model',
            actualEffort: 'high',
            actualEffortSource: 'codex.thread/start',
            actualEffortAt: '2026-10-09T00:00:00Z',
          },
        }}
      />,
    );
    expect(screen.getByTestId('run-execution')).toHaveTextContent(
      'Requested model: actual-model (actual: actual-model)',
    );
    expect(screen.getByTestId('run-execution')).toHaveTextContent(
      'Requested reasoning: high · Actual reasoning: high · Source: codex.thread/start · Changed: 2026-10-09T00:00:00Z',
    );
  });
});
