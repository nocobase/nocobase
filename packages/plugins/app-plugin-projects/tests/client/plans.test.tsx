import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { act, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Plan, PlanRow } from '../../shared/plans.js';
import {
  FakeApiError,
  api,
  clientMocks,
  me,
  resetApi,
  toasts,
} from './fake-client.js';
import { renderAt } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { PlanCard } = await import('../../client/kit/plans/plan-card.js');
const { PlanEditor } = await import('../../client/kit/plans/plan-editor.js');
const { PlanListItem } =
  await import('../../client/kit/plans/plan-list-item.js');
const { PlanWordingContext } =
  await import('../../client/kit/plans/plan-text.js');
const model = await import('../../client/kit/plans/model.js');
const {
  IntakeAgentSlotContext,
  createPageContextStore,
  normalizeEntry,
  usePageContextEntries,
  usePageContextSource,
  PAGE_CONTEXT_MAX_FILTERS,
} = await import('../../client/kit/page-context.js');
const { IntakeAgentSlot, PageContextProvider } =
  await import('../../client/kit/page-slots.js');

afterEach(cleanup);

const HOUR = 3_600_000;
const later = (hours: number) =>
  new Date(Date.now() + hours * HOUR).toISOString();

function row(
  position: number,
  params: Record<string, unknown>,
  extra: Partial<PlanRow> = {},
): PlanRow {
  return {
    id: `row-${position}`,
    position,
    op: 'issue.create',
    ref: `r${position + 1}`,
    params,
    check: {
      ok: true,
      error: null,
      target: null,
      wakes: [],
      flags: [],
      baseline: null,
    },
    result: null,
    ...extra,
  };
}

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'plan-1',
    title: 'Release',
    description: '',
    status: 'pending',
    voidReason: null,
    source: { kind: 'intake' },
    proposer: null,
    proposerName: null,
    deciderUserId: 'u1',
    deciderName: 'u1',
    createdBy: { type: 'user', id: 'u1' },
    revision: 3,
    rows: [
      row(0, { title: 'Parent' }),
      row(1, { title: 'Child', parentIssueId: { ref: 'r1' } }),
      row(2, { title: 'Sibling' }),
    ],
    failure: null,
    expiresAt: later(20),
    rehearsedAt: new Date().toISOString(),
    executedAt: null,
    executedById: null,
    undoableUntil: null,
    skipped: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const risky = (base: Plan): Plan => ({
  ...base,
  rows: base.rows.map((item, index) =>
    index === 2
      ? {
          ...item,
          params: {
            ...(item.params as object),
            executor: { type: 'agent', id: 'a1' },
          },
          check: {
            ok: true,
            error: null,
            target: null,
            wakes: [
              {
                kind: 'agent',
                principalId: 'a1',
                name: 'Coder',
                subjectId: 'x',
                triggerType: 'assigned',
                started: true,
              },
            ],
            flags: ['startsRun', 'agentExecutor'],
            baseline: null,
          },
        }
      : item,
  ),
});

let current: Plan;

beforeEach(() => {
  current = plan();
  resetApi({
    'projects/me': () => ({ data: me('admin') }),
    'projects/members': () => ({
      data: [{ userId: 'u1', name: 'u1', email: null }],
    }),
    'projects/labels': () => ({ data: [] }),
    projects: () => ({ data: [] }),
    'projects/plans': () => ({ data: [], meta: {} }),
    'GET projects/plans/plan-1': () => ({ data: current }),
  });
});

describe('the plan model', () => {
  it('turns edits into the PATCH body', () => {
    const edits = new Map([
      ['row-0', { params: { title: 'Renamed' } }],
      ['row-2', { remove: true }],
    ]);
    expect(model.editRequest(current, edits)).toEqual({
      revision: 3,
      rows: [
        { id: 'row-0', params: { title: 'Renamed' } },
        { id: 'row-2', remove: true },
      ],
    });
    expect(model.editRequest(current, new Map())).toBeNull();
  });

  it('indents a row under the one above it and outdents it again', () => {
    const views = model.rowViews(current.rows);
    expect(views.map((view) => view.depth)).toEqual([0, 1, 0]);
    expect(model.canIndent(views, 0)).toBe(false);
    expect(model.canIndent(views, 2)).toBe(true);
    expect(model.indentParams(views, 2)).toEqual({
      title: 'Sibling',
      parentIssueId: { ref: 'r1' },
    });
    expect(model.outdentParams(views, 1)).toEqual({ title: 'Child' });
    expect(model.canOutdent(views, 0)).toBe(false);
  });

  it('says what may be done in each state', () => {
    expect(model.abilitiesOf(current, 'u1')).toMatchObject({
      execute: true,
      retry: false,
      void: true,
      undo: false,
    });
    expect(model.abilitiesOf(plan({ status: 'stale' }), 'u1')).toMatchObject({
      execute: false,
      retry: true,
    });
    const executed = plan({
      status: 'executed',
      executedById: 'u1',
      undoableUntil: later(5),
    });
    expect(model.abilitiesOf(executed, 'u1').undo).toBe(true);
    expect(model.abilitiesOf(executed, 'u2').undo).toBe(false);
    const expired = plan({ expiresAt: later(-1) });
    expect(model.effectiveStatus(expired)).toBe('expired');
    expect(model.abilitiesOf(expired, 'u1').execute).toBe(false);
    expect(model.riskyRows(model.rowViews(risky(current).rows))).toHaveLength(
      1,
    );
  });

  it('counts down to expiry, or to the end of the undo window for whoever executed it', () => {
    expect(model.planCountdown(current, 'u1')).toEqual({
      kind: 'expires',
      hours: 20,
    });
    const executed = plan({
      status: 'executed',
      executedById: 'u1',
      undoableUntil: later(5),
    });
    expect(model.planCountdown(executed, 'u1')).toEqual({
      kind: 'undo',
      hours: 5,
    });
    expect(model.planCountdown(executed, 'u2')).toBeNull();
    expect(model.planCountdown(plan({ status: 'voided' }), 'u1')).toBeNull();
  });

  it('hands a removed row’s sub-issues to its parent, and restores it', () => {
    const views = model.rowViews(current.rows);
    const removal = model.removalEdits(views, views[0]!);
    expect(removal.get('row-0')).toEqual({ remove: true });
    expect(removal.get('row-1')).toEqual({ params: { title: 'Child' } });
    const edits = model.mergeEdits(new Map(), removal);
    expect(model.restoreEdits(edits, 'row-0').has('row-0')).toBe(false);
    expect(model.blockingRefs(views).has('r1')).toBe(false);
  });

  it('writes a project target as one select value and reads it back', () => {
    expect(model.encodeProjectTarget({ ref: 'p' })).toBe('ref:p');
    expect(model.encodeProjectTarget('p-1')).toBe('p-1');
    expect(model.encodeProjectTarget(null)).toBeNull();
    expect(model.decodeProjectTarget('ref:p')).toEqual({ ref: 'p' });
    expect(model.decodeProjectTarget('p-1')).toBe('p-1');
    expect(model.patchParams({ a: 1, b: 2 }, { a: undefined, c: 3 })).toEqual({
      b: 2,
      c: 3,
    });
  });
});

describe('the plan editor', () => {
  it('saves title edits, indenting and removals as one PATCH', async () => {
    let body: unknown;
    api.routes['PATCH projects/plans/plan-1'] = (request) => {
      body = request.json;
      return { data: { ...current, revision: 4 } };
    };
    renderAt('/', [{ path: '/', element: <PlanEditor plan={current} /> }]);
    fireEvent.change(
      await screen.findByLabelText('Parent plans.columns.title'),
      {
        target: { value: 'Parent renamed' },
      },
    );
    fireEvent.click(screen.getByLabelText('plans.indent(title=Sibling)'));
    fireEvent.click(screen.getByLabelText('plans.removeRow(title=Child)'));
    fireEvent.click(screen.getByRole('button', { name: /plans.saveChanges/u }));
    await waitFor(() => expect(body).toBeDefined());
    expect(body).toEqual({
      revision: 3,
      rows: [
        { id: 'row-0', params: { title: 'Parent renamed' } },
        {
          id: 'row-2',
          params: { title: 'Sibling', parentIssueId: { ref: 'r1' } },
        },
        { id: 'row-1', remove: true },
      ],
    });
  });

  it('hands a removed parent’s sub-issues to its own parent', async () => {
    let body: { rows: unknown[] } | undefined;
    api.routes['PATCH projects/plans/plan-1'] = (request) => {
      body = request.json as { rows: unknown[] };
      return { data: current };
    };
    renderAt('/', [{ path: '/', element: <PlanEditor plan={current} /> }]);
    fireEvent.click(
      await screen.findByLabelText('plans.removeRow(title=Parent)'),
    );
    fireEvent.click(screen.getByRole('button', { name: /plans.saveChanges/u }));
    await waitFor(() => expect(body).toBeDefined());
    expect(body?.rows).toEqual([
      { id: 'row-0', remove: true },
      { id: 'row-1', params: { title: 'Child' } },
    ]);
  });

  it('shows each refused row’s error after a save', async () => {
    class Invalid extends FakeApiError {
      public readonly payload = {
        error: {
          code: 400,
          status: 'INVALID_ARGUMENT',
          reason: 'PLAN_INVALID',
          domain: 'projects',
          message: 'The plan is invalid.',
          metadata: {
            rows: [
              {
                ok: true,
                error: null,
                target: null,
                wakes: [],
                flags: [],
                baseline: null,
              },
              {
                ok: false,
                error: { code: 'INVALID_TITLE', message: 'bad' },
                target: null,
                wakes: [],
                flags: [],
                baseline: null,
              },
              {
                ok: true,
                error: null,
                target: null,
                wakes: [],
                flags: [],
                baseline: null,
              },
            ],
          },
        },
      };
    }
    api.routes['PATCH projects/plans/plan-1'] = () => {
      throw new Invalid(400, 'PLAN_INVALID');
    };
    renderAt('/', [{ path: '/', element: <PlanEditor plan={current} /> }]);
    fireEvent.change(
      await screen.findByLabelText('Child plans.columns.title'),
      {
        target: { value: '' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: /plans.saveChanges/u }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'errors.INVALID_TITLE',
    );
  });

  it('creates the issues with "Create N issues"', async () => {
    const executed = vi.fn();
    api.routes['POST projects/plans/plan-1/execute'] = () => ({
      data: { ...current, status: 'executed' },
    });
    renderAt('/', [
      {
        path: '/',
        element: <PlanEditor plan={current} onExecuted={executed} />,
      },
    ]);
    fireEvent.click(
      await screen.findByRole('button', {
        name: /plans.createIssues\(count=3\)/u,
      }),
    );
    await waitFor(() => expect(executed).toHaveBeenCalled());
    expect(
      api.calls.find((call) => call.path.endsWith('/execute'))?.json,
    ).toEqual({
      revision: 3,
    });
  });
});

describe('the plan card', () => {
  it('asks once more before executing a plan with a risky row', async () => {
    current = risky(current);
    api.routes['POST projects/plans/plan-1/execute'] = () => ({
      data: { ...current, status: 'executed', revision: 5 },
    });
    renderAt('/', [{ path: '/', element: <PlanCard planId='plan-1' /> }]);
    expect(
      await screen.findByText('plans.wakes(name=Coder)'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('plan-execute'));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByTestId('plan-risky-rows')).toHaveTextContent(
      'plans.flags.agentExecutor',
    );
    expect(api.calls.some((call) => call.path.endsWith('/execute'))).toBe(
      false,
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'plans.execute' }),
    );
    await waitFor(() =>
      expect(api.calls.some((call) => call.path.endsWith('/execute'))).toBe(
        true,
      ),
    );
  });

  it('executes a plan without risky rows at once', async () => {
    api.routes['POST projects/plans/plan-1/execute'] = () => ({
      data: { ...current, status: 'executed' },
    });
    renderAt('/', [{ path: '/', element: <PlanCard planId='plan-1' /> }]);
    fireEvent.click(await screen.findByTestId('plan-execute'));
    await waitFor(() =>
      expect(toasts.some((toast) => toast.title === 'plans.executed')).toBe(
        true,
      ),
    );
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('offers to check a stale plan again', async () => {
    current = plan({
      status: 'stale',
      failure: { code: 'PLAN_STALE', message: 'changed', rowId: 'row-0' },
    });
    api.routes['POST projects/plans/plan-1/retry'] = () => ({
      data: { ...current, status: 'pending', failure: null },
    });
    renderAt('/', [{ path: '/', element: <PlanCard planId='plan-1' /> }]);
    expect(await screen.findByText('plans.staleNotice')).toBeInTheDocument();
    expect(screen.queryByTestId('plan-execute')).toBeNull();
    fireEvent.click(screen.getByTestId('plan-retry'));
    await waitFor(() =>
      expect(api.calls.some((call) => call.path.endsWith('/retry'))).toBe(true),
    );
  });

  it('undoes an executed plan in one step, after a preview of what it reverts', async () => {
    current = plan({
      status: 'executed',
      executedAt: new Date().toISOString(),
      executedById: 'u1',
      undoableUntil: later(10),
      rows: current.rows.map((item) => ({
        ...item,
        result: {
          target: null,
          created: { type: 'issue', id: `i-${item.id}`, identifier: 'PM-1' },
          after: null,
          revision: 1,
          wakes: [],
        },
      })),
    });
    const bodies: unknown[] = [];
    api.routes['POST projects/plans/plan-1/undo'] = (call) => {
      bodies.push(call.json);
      if ((call.json as { dryRun?: boolean } | undefined)?.dryRun)
        return {
          data: {
            planId: 'plan-1',
            revert: [
              {
                rowId: 'row-0',
                position: 0,
                op: 'issue.retract',
                target: { type: 'issue', id: 'i-row-0', identifier: 'PM-1' },
                restore: null,
              },
            ],
            skipped: [
              {
                rowId: 'row-1',
                position: 1,
                reason: 'changed',
                message: 'The issue was changed since.',
              },
            ],
          },
        };
      current = { ...current, status: 'undone', undoableUntil: null };
      return { data: current };
    };
    renderAt('/', [{ path: '/', element: <PlanCard planId='plan-1' /> }]);
    expect(await screen.findAllByText('plans.openResult')).toHaveLength(3);
    fireEvent.click(screen.getByTestId('plan-undo'));
    expect(await screen.findByTestId('plan-undo-revert')).toHaveTextContent(
      'plans.undoPreview.ops.issue.retract',
    );
    expect(screen.getByTestId('plan-undo-skipped')).toHaveTextContent(
      'plans.undoPreview.skippedRow',
    );
    // Previewing changed nothing; confirming undoes it at once, with no other plan shown.
    expect(bodies).toEqual([{ dryRun: true }]);
    fireEvent.click(screen.getByTestId('plan-undo-confirm'));
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]).toEqual({});
    await waitFor(() =>
      expect(screen.getByTestId('plan-card')).toHaveAttribute(
        'data-plan-status',
        'undone',
      ),
    );
    expect(screen.getAllByTestId('plan-card')).toHaveLength(1);
  });

  it('offers nothing on a voided or expired plan', async () => {
    current = plan({ status: 'voided', voidReason: 'superseded' });
    renderAt('/', [{ path: '/', element: <PlanCard planId='plan-1' /> }]);
    expect(await screen.findByText('plans.superseded')).toBeInTheDocument();
    expect(screen.queryByTestId('plan-execute')).toBeNull();
    cleanup();
    current = plan({ expiresAt: later(-1) });
    renderAt('/', [{ path: '/', element: <PlanCard planId='plan-1' /> }]);
    expect(await screen.findByText('plans.status.expired')).toBeInTheDocument();
    expect(screen.queryByTestId('plan-execute')).toBeNull();
  });

  it('reads as the application words it, or as stored', async () => {
    current = plan({ title: 'Stored title', description: 'Stored words' });
    renderAt('/', [
      {
        path: '/',
        element: (
          <PlanWordingContext.Provider
            value={(given) =>
              given.id === 'plan-1' ? { title: 'Worded title' } : null
            }
          >
            <PlanCard planId='plan-1' />
          </PlanWordingContext.Provider>
        ),
      },
    ]);
    expect(await screen.findByText('Worded title')).toBeInTheDocument();
    expect(screen.queryByText('Stored title')).toBeNull();
    // A wording without a description keeps the stored one.
    expect(screen.getByText('Stored words')).toBeInTheDocument();
  });
});

describe('the plan list item', () => {
  it('shows the title, status, source and proposer, and links to the plan page', async () => {
    renderAt('/', [
      {
        path: '/',
        element: (
          <PlanListItem
            plan={plan({
              source: { kind: 'conversation' },
              proposerName: 'Coder',
            })}
          />
        ),
      },
      { path: '/issues/plans/:planId', element: <p>plan page</p> },
    ]);
    const link = screen.getByRole('link', { name: /Release/u });
    expect(link).toHaveAttribute('href', '/issues/plans/plan-1');
    expect(within(link).getByText('plans.status.pending')).toBeInTheDocument();
    expect(
      within(link).getByText('plans.source.conversation'),
    ).toBeInTheDocument();
    expect(
      within(link).getByText('plans.proposedBy(name=Coder)'),
    ).toBeInTheDocument();
    fireEvent.click(link);
    expect(await screen.findByText('plan page')).toBeInTheDocument();
  });

  it('selects the plan instead when asked to, marking the selected one', () => {
    const onSelect = vi.fn();
    renderAt('/', [
      {
        path: '/',
        element: (
          <PlanListItem
            plan={plan({ status: 'executed' })}
            selected
            onSelect={onSelect}
          />
        ),
      },
    ]);
    const button = screen.getByRole('button', { name: /Release/u });
    expect(button).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('plans.status.executed')).toBeInTheDocument();
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'plan-1' }),
    );
  });

  it('links where the list says, such as the plan over the issue it is listed on', () => {
    renderAt('/', [
      {
        path: '/',
        element: <PlanListItem plan={plan()} to='/issues/PM-12/plans/plan-1' />,
      },
    ]);
    expect(screen.getByRole('link', { name: /Release/u })).toHaveAttribute(
      'href',
      '/issues/PM-12/plans/plan-1',
    );
  });
});

describe('page context', () => {
  function Source({ id }: { readonly id: string }): null {
    usePageContextSource({ kind: 'issue', id, label: `Issue ${id}` });
    return null;
  }
  function Entries(): ReactElement {
    return (
      <output>
        {usePageContextEntries()
          .map((entry) => entry.id)
          .join(',')}
      </output>
    );
  }

  it('collects what mounted pages register and forgets them on unmount', () => {
    const view = render(
      <PageContextProvider>
        <Source id='a' />
        <Source id='b' />
        <Entries />
      </PageContextProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('a,b');
    view.rerender(
      <PageContextProvider>
        <Source id='b' />
        <Entries />
      </PageContextProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('b');
  });

  it('does nothing without a provider', () => {
    render(
      <>
        <Source id='a' />
        <Entries />
      </>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('keeps entries within the limits', () => {
    const store = createPageContextStore();
    act(() => {
      for (let n = 0; n < 12; n += 1)
        store.register(`k${n}`, { kind: 'issue', id: String(n) });
    });
    expect(store.entries()).toHaveLength(10);
    const filters = Object.fromEntries(
      Array.from({ length: 30 }, (_, n) => [`f${n}`, 'x']),
    );
    expect(
      Object.keys(normalizeEntry({ kind: 'issues', filters }).filters ?? {}),
    ).toHaveLength(PAGE_CONTEXT_MAX_FILTERS);
    expect(
      normalizeEntry({ kind: 'x', label: 'y'.repeat(500) }).label,
    ).toHaveLength(200);
  });
});

function OrganizeButton({ text }: { readonly text: string }): ReactElement {
  return <button type='button'>organize {text}</button>;
}

describe('the slot', () => {
  it('renders nothing until the application fills it', () => {
    const { container } = render(
      <>
        <IntakeAgentSlot
          text='x'
          fileIds={[]}
          projectId={null}
          disabled={false}
          onPlan={() => undefined}
        />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the fill with what to hand over', () => {
    render(
      <IntakeAgentSlotContext.Provider value={{ Organize: OrganizeButton }}>
        <IntakeAgentSlot
          text='notes'
          fileIds={[]}
          projectId={null}
          disabled={false}
          onPlan={() => undefined}
        />
      </IntakeAgentSlotContext.Provider>,
    );
    expect(
      screen.getByRole('button', { name: 'organize notes' }),
    ).toBeInTheDocument();
  });
});
