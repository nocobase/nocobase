import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IntakeAiJob } from '../../shared/intake-ai.js';
import type { Plan, PlanRow } from '../../shared/plans.js';
import { api, clientMocks, me, resetApi } from './fake-client.js';
import { renderAt } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: NewIssuePage } =
  await import('../../client/pages/issues/new.js');
const { default: NewSubtaskPage } =
  await import('../../client/pages/issues/detail/new-subtask.js');
const { useIntakeBreakdown } =
  await import('../../client/pages/intake/use-intake-breakdown.js');

/** What an application draws over `useIntakeBreakdown`: the button while AI can be asked. */
function BreakdownButton(): ReactElement | null {
  const breakdown = useIntakeBreakdown('i1');
  return breakdown.available ? (
    <button
      type='button'
      data-testid='intake-ai-breakdown'
      onClick={() => void breakdown.start()}
    >
      intakeAi.breakdown
    </button>
  ) : null;
}

afterEach(cleanup);

function row(position: number, title: string, ref = `r${position + 1}`) {
  return {
    id: `${ref}-row`,
    position,
    op: 'issue.create',
    ref,
    params: { title },
    check: {
      ok: true,
      error: null,
      target: null,
      wakes: [],
      flags: [],
      baseline: null,
    },
    result: null,
  } satisfies PlanRow;
}

function plan(id: string, rows: PlanRow[], data: unknown = {}): Plan {
  const now = new Date().toISOString();
  return {
    id,
    title: 'Draft',
    description: '',
    status: 'pending',
    voidReason: null,
    source: { kind: 'intake', data },
    proposer: null,
    proposerName: null,
    deciderUserId: 'u1',
    deciderName: 'u1',
    createdBy: { type: 'user', id: 'u1' },
    revision: 1,
    rows,
    failure: null,
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    rehearsedAt: now,
    executedAt: null,
    executedById: null,
    undoableUntil: null,
    skipped: [],
    createdAt: now,
    updatedAt: now,
  };
}

function job(overrides: Partial<IntakeAiJob>): IntakeAiJob {
  return {
    id: 'j1',
    mode: 'split',
    status: 'running',
    instruction: null,
    basePlanId: null,
    issue: null,
    planId: null,
    changes: null,
    unknownLabels: [],
    dropped: 0,
    error: null,
    progress: {
      phase: 'working',
      by: 'Planner',
      waitReason: null,
      activity: 'Reading the notes',
      since: null,
    },
    createdAt: new Date().toISOString(),
    finishedAt: null,
    ...overrides,
  };
}

const base = {
  'projects/me': () => ({ data: me('admin') }),
  projects: () => ({ data: [] }),
  'projects/labels': () => ({ data: [] }),
  'projects/members': () => ({
    data: [{ userId: 'u1', name: 'Ann', email: null }],
  }),
  'GET projects/intake/aiAvailability': () => ({
    data: { available: true, reason: null, by: 'Planner', waits: false },
  }),
};

const location = () => screen.getByTestId('location').textContent ?? '';

const renderTab = (search: string) =>
  renderAt(`/issues/new${search}`, [
    { path: '/issues/new', element: <NewIssuePage /> },
    { path: '*', element: <p>elsewhere</p> },
  ]);

beforeEach(() => window.localStorage.clear());

describe('AI on the AI draft tab', () => {
  it('follows an AI request: a progress card, then the drafts as editable rows', async () => {
    let reads = 0;
    resetApi({
      ...base,
      'POST projects/intake/aiJobs': () => ({ data: job({}) }),
      'projects/intake/aiJobs/j1': () => {
        reads += 1;
        return {
          data:
            reads < 2
              ? job({})
              : job({ status: 'done', planId: 'p-ai', progress: null }),
        };
      },
      'projects/plans/p-ai': () => ({
        data: plan('p-ai', [row(0, '登录页'), row(1, '导出报表')], {
          jobId: 'j1',
          mode: 'split',
        }),
      }),
    });
    renderTab('?tab=ai&job=j1');
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByTestId('intake-ai-progress'),
    ).toBeTruthy();
    expect(within(dialog).getByText('intakeAi.progress.split')).toBeTruthy();
    expect(
      within(dialog).getByText('intakeAi.lastActivity(text=Reading the notes)'),
    ).toBeTruthy();

    expect(
      await within(dialog).findByTestId('plan-editor', {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(within(dialog).queryByTestId('intake-ai-progress')).toBeNull();
    expect(within(dialog).getByDisplayValue('导出报表')).toBeTruthy();
    expect(location()).toContain('draft=p-ai');
    expect(location()).not.toContain('job=');
    expect(within(dialog).getByTestId('intake-revise')).toBeTruthy();
  });

  it('revises the drafts by an instruction, highlights what changed, and undoes it', async () => {
    const before = plan('p1', [row(0, 'Login'), row(1, 'Audit')]);
    const after = plan('p2', [row(0, 'Login'), row(1, 'Login form')]);
    resetApi({
      ...base,
      'projects/plans/p1': () => ({ data: before }),
      'projects/plans/p2': () => ({ data: after }),
      'projects/plans/p3': () => ({ data: plan('p3', before.rows) }),
      'POST projects/intake/aiJobs': () => ({
        data: job({ mode: 'revise', basePlanId: 'p1' }),
      }),
      'projects/intake/aiJobs/j1': () => ({
        data: job({
          mode: 'revise',
          status: 'done',
          basePlanId: 'p1',
          planId: 'p2',
          instruction: 'Drop audit, add a login form',
          changes: { rows: { r2: 'added' }, removed: ['Audit'] },
          progress: null,
        }),
      }),
      'POST projects/plans': () => ({ data: plan('p3', before.rows) }),
      'POST projects/plans/p2/void': () => ({
        data: { ...after, status: 'voided' },
      }),
    });
    renderTab('?tab=ai&draft=p1');
    const dialog = await screen.findByRole('dialog');
    const box = await within(dialog).findByLabelText('intakeAi.revise.label');
    fireEvent.change(box, {
      target: { value: 'Drop audit, add a login form' },
    });
    fireEvent.keyDown(box, { key: 'Enter' });

    await waitFor(() => expect(location()).toContain('draft=p2'));
    expect(await within(dialog).findByTestId('plan-row-added')).toBeTruthy();
    expect(
      within(dialog)
        .getByTestId('plan-editor')
        .querySelectorAll('[data-change="added"]'),
    ).toHaveLength(1);
    expect(
      within(dialog).getByText('intakeAi.removed(count=1,titles=Audit)'),
    ).toBeTruthy();
    expect(
      api.calls.find(
        (call) =>
          call.method === 'POST' && call.path === 'projects/intake/aiJobs',
      )?.json,
    ).toMatchObject({
      mode: 'revise',
      planId: 'p1',
      instruction: 'Drop audit, add a login form',
    });

    fireEvent.click(within(dialog).getByText('intakeAi.revise.undo'));
    await waitFor(() => expect(location()).toContain('draft=p3'));
    const restored = api.calls.find(
      (call) => call.method === 'POST' && call.path === 'projects/plans',
    );
    expect(restored?.json).toMatchObject({
      source: { kind: 'intake' },
      rows: [
        { op: 'issue.create', ref: 'r1', params: { title: 'Login' } },
        { op: 'issue.create', ref: 'r2', params: { title: 'Audit' } },
      ],
    });
    expect(
      api.calls.some(
        (call) =>
          call.method === 'POST' && call.path === 'projects/plans/p2/void',
      ),
    ).toBe(true);
    expect(
      await within(dialog).findByText('intakeAi.revise.undoneTag'),
    ).toBeTruthy();
  });

  it('says why AI could not draft, and offers only the rules without an organiser', async () => {
    resetApi({
      ...base,
      'projects/intake/aiJobs/j9': () => ({
        data: job({
          id: 'j9',
          status: 'failed',
          error: { code: 'runFailed', message: 'No runtime took the work.' },
          progress: null,
        }),
      }),
    });
    const first = renderTab('?tab=ai&job=j9');
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText(
        'intakeAi.failedWhy(message=No runtime took the work.)',
      ),
    ).toBeTruthy();
    await waitFor(() => expect(location()).not.toContain('job='));
    first.unmount();

    const { 'GET projects/intake/aiAvailability': _available, ...rest } = base;
    resetApi(rest);
    renderTab('?tab=ai');
    const plain = await screen.findByRole('dialog');
    expect(within(plain).getByText('intake.splitAction')).toBeTruthy();
  });
});

describe('AI breakdown', () => {
  it('asks AI to break the issue down and follows the request in the New sub-issue dialog over the issue', async () => {
    resetApi({
      ...base,
      'POST projects/intake/aiJobs': () => ({
        data: job({
          mode: 'breakdown',
          issue: { id: 'i1', identifier: 'PM-7', title: 'Checkout' },
        }),
      }),
    });
    renderAt('/issues/PM-7', [
      {
        path: '/issues/PM-7',
        element: <BreakdownButton />,
      },
      { path: '/issues/PM-7/new-subtask', element: <p>new sub-issue</p> },
    ]);
    fireEvent.click(await screen.findByTestId('intake-ai-breakdown'));
    await waitFor(() =>
      expect(location()).toBe('/issues/PM-7/new-subtask?tab=ai&job=j1'),
    );
    expect(
      api.calls.find(
        (call) =>
          call.path === 'projects/intake/aiJobs' && call.method === 'POST',
      )?.json,
    ).toEqual({ mode: 'breakdown', issueId: 'i1' });
  });

  it('shows a breakdown’s drafts as sub-issues of its issue, without the requirements box', async () => {
    resetApi({
      ...base,
      'projects/intake/aiJobs/j1': () => ({
        data: job({
          mode: 'breakdown',
          issue: { id: 'i1', identifier: 'PM-7', title: 'Checkout' },
        }),
      }),
    });
    renderTab('?tab=ai&job=j1');
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText(
        'intakeAi.breakdownHint(issue=PM-7 Checkout)',
      ),
    ).toBeTruthy();
    expect(
      within(dialog).getByText('intakeAi.progress.breakdown(issue=PM-7)'),
    ).toBeTruthy();
    expect(within(dialog).queryByLabelText('intake.textLabel')).toBeNull();
  });
  it('keeps the breakdown when switching to Manual and back, over the issue', async () => {
    resetApi({
      ...base,
      'projects/issues/PM-7': () => ({
        data: { id: 'i1', identifier: 'PM-7', title: 'Checkout', subtasks: [] },
      }),
      'projects/intake/aiJobs/j1': () => ({
        data: job({
          mode: 'breakdown',
          issue: { id: 'i1', identifier: 'PM-7', title: 'Checkout' },
        }),
      }),
    });
    renderAt('/issues/PM-7/new-subtask?tab=ai&job=j1', [
      { path: '/issues/:issueId/new-subtask', element: <NewSubtaskPage /> },
      { path: '*', element: <p>elsewhere</p> },
    ]);
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText(
        'intakeAi.progress.breakdown(issue=PM-7)',
      ),
    ).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole('tab', { name: 'subtasks.tabs.manual' }),
    );
    expect(
      await within(dialog).findByLabelText('issueForm.titleLabel'),
    ).toBeVisible();
    expect(location()).toContain('job=j1');
    fireEvent.click(
      within(dialog).getByRole('tab', { name: 'subtasks.tabs.ai' }),
    );
    expect(
      within(dialog).getByText('intakeAi.progress.breakdown(issue=PM-7)'),
    ).toBeVisible();
    expect(location()).toBe('/issues/PM-7/new-subtask?tab=ai&job=j1');
  });
});
