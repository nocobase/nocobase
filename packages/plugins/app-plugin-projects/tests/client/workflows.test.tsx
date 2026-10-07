import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';

import {
  BUILTIN_STATUSES,
  type WorkflowDefinition,
  type WorkflowListItem,
} from '../../shared/workflows.js';
import {
  impliedActorsAt,
  keyFor,
  moveStatus,
  setActorsAt,
  explicitEdges,
  flowOrder,
  reachableFrom,
  transitionCell,
  wildcardMoves,
  workflowRules,
} from '../../client/pages/config/workflows/workflow-model.js';
import type {
  StatusRuleEditorProps,
  StatusRuleSummaryProps,
  StatusRuleTypeUI,
} from '../../client/lib/status-rule-types.js';
import { api, clientMocks, me, resetApi } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: WorkflowDetailPage } =
  await import('../../client/pages/config/workflow-detail.js');
const { default: WorkflowsPage } =
  await import('../../client/pages/config/workflows.js');
const { StatusRuleTypesContext } =
  await import('../../client/lib/status-rule-types.js');

afterEach(cleanup);

/** Saving asks first what the change wakes; nothing, unless a test says otherwise. */
const noWakes = {
  'POST projects/workflows/wf1/preview': () => ({
    data: { rules: [], attention: [] },
  }),
};

const definition: WorkflowDefinition = {
  states: BUILTIN_STATUSES,
  transitions: [
    { from: '*', to: '*', actors: ['user'] },
    { from: 'todo', to: 'in_progress', actors: ['system'] },
  ],
};

const software: WorkflowListItem = {
  id: 'wf1',
  name: 'Release train',
  description: null,
  isDefault: true,
  builtInKey: null,
  definition,
  revision: 3,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
  projectCount: 2,
};

function renderDetail(types: readonly StatusRuleTypeUI[] = []): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <StatusRuleTypesContext.Provider value={types}>
        <MemoryRouter initialEntries={['/config/workflows/wf1']}>
          <Routes>
            <Route path='/config/workflows' element={<Outlet />}>
              <Route path=':workflowId' element={<WorkflowDetailPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </StatusRuleTypesContext.Provider>
    </QueryClientProvider>,
  );
}

/** Picks `key` from the rules dialog's "Add rule" menu. */
async function addRule(key: string): Promise<void> {
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'workflows.rules.add' }),
  );
  const item = await waitFor(() => {
    const found = document.querySelector(`[data-add-rule="${key}"]`);
    if (!found) throw new Error(`No "${key}" in the Add rule menu`);
    return found as HTMLElement;
  });
  fireEvent.click(item);
}

/** What the "Add rule" menu offers, by key. */
async function addable(): Promise<string[]> {
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'workflows.rules.add' }),
  );
  await waitFor(() => {
    if (!document.querySelector('[data-add-rule]'))
      throw new Error('The Add rule menu is not open');
  });
  const keys = [...document.querySelectorAll('[data-add-rule]')].map(
    (node) => node.getAttribute('data-add-rule') ?? '',
  );
  fireEvent.keyDown(document.activeElement ?? document.body, {
    key: 'Escape',
  });
  return keys;
}

async function startEditing(): Promise<void> {
  fireEvent.click(
    await screen.findByRole('button', { name: 'workflows.edit' }),
  );
}

describe('the workflow page', () => {
  it('shows the flow, the matrix and the rules as the old page did, and edits them after Edit', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [software] }),
    });
    renderDetail();

    const flow = await screen.findByRole('region', {
      name: 'workflows.flowTitle',
    });
    // Four category columns, and only the transition set for two concrete statuses is drawn.
    for (const category of ['unstarted', 'started', 'done', 'closed'])
      expect(
        within(flow).getByRole('list', {
          name: `workflows.categories.${category}.title`,
        }),
      ).toBeTruthy();
    expect(
      [...flow.querySelectorAll('[data-edge]')].map((edge) =>
        edge.getAttribute('data-edge'),
      ),
    ).toEqual(['todo>in_progress']);
    // `* → *` is stated above the diagram instead of drawn.
    expect(
      within(flow).getByText(
        'workflows.wildcardLine(actor=workflows.actors.user,moves=workflows.anyToAny)',
      ),
    ).toBeTruthy();
    // Pointing at a status shows where it can go, wildcards included.
    fireEvent.click(within(flow).getByRole('button', { name: /status\.todo/ }));
    const reachable = [...flow.querySelectorAll('[data-reachable]')].map(
      (node) => node.getAttribute('data-reachable'),
    );
    expect(reachable).toContain('in_progress');
    expect(reachable).toContain('cancelled');
    expect(reachable).not.toContain('todo');
    expect(
      flow.querySelector('[data-node="todo"]')?.getAttribute('data-state'),
    ).toBe('source');
    const matrix = screen.getByRole('region', { name: 'workflows.matrix' });
    // In view mode a cell shows everyone a matching entry names, `*` included.
    const cell = matrix.querySelector(
      '[data-from="todo"][data-to="in_progress"]',
    ) as HTMLElement;
    expect(
      [...cell.querySelectorAll('[data-actor]')].map((node) =>
        node.getAttribute('data-actor'),
      ),
    ).toEqual(['user', 'system']);
    const rules = screen.getByRole('region', { name: 'workflows.rulesTitle' });
    expect(
      within(rules).getByText(
        'workflows.rule(actors=workflows.actors.system,from=status.todo,to=status.in_progress)',
      ),
    ).toBeTruthy();
    // Nothing is editable until Edit.
    expect(screen.queryByRole('button', { name: 'workflows.save' })).toBeNull();
    expect(screen.queryByRole('switch')).toBeNull();

    await startEditing();
    expect(
      await screen.findByRole('switch', { name: /workflows\.peopleAnywhere/u }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: 'workflows.rules.edit(name=status.in_review)',
      }),
    ).toBeTruthy();

    // Discard leaves edit mode with nothing sent.
    fireEvent.click(screen.getByRole('button', { name: 'workflows.discard' }));
    expect(
      await screen.findByRole('button', { name: 'workflows.edit' }),
    ).toBeTruthy();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(api.calls.some((call) => call.method === 'PATCH')).toBe(false);
  });

  it('keeps the same matrix and the same rule sentences in edit mode', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [software] }),
    });
    renderDetail();

    const headers = (): string[] =>
      [
        ...screen
          .getByRole('table', { name: 'workflows.matrix' })
          .querySelectorAll('th'),
      ].map((cell) => cell.textContent ?? '');
    const sentences = (): string[] =>
      [
        ...screen
          .getByRole('region', { name: 'workflows.rulesTitle' })
          .querySelectorAll('li'),
      ]
        .map((item) => item.textContent ?? '')
        .filter((text) => text.includes('workflows.rule('));
    await screen.findByRole('table', { name: 'workflows.matrix' });
    const viewHeaders = headers();
    const viewSentences = sentences();
    expect(viewHeaders).toContain('workflows.anyStatus');
    expect(viewSentences.length).toBeGreaterThan(0);

    await startEditing();
    await screen.findByRole('switch', { name: /workflows\.peopleAnywhere/u });
    expect(headers()).toEqual(viewHeaders);
    expect(sentences()).toEqual(viewSentences);
    // Every status gets the button that opens its rules, including those without any yet.
    expect(
      screen.getAllByRole('button', { name: /^workflows\.rules\.edit/u }),
    ).toHaveLength(definition.states.length);
  });

  it('locks an actor a cell allows through "Any status", and clearing its own entry leaves that rule alone', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [software] }),
      'PATCH projects/workflows/wf1': () => ({ data: software }),
    });
    renderDetail();
    await startEditing();

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.cellLabel(from=status.todo,to=status.in_progress)',
      }),
    );
    // People reach this move through `* → *`: shown as allowed, and locked here.
    const people = (await screen.findByRole('checkbox', {
      name: /workflows\.actors\.user/u,
    })) as HTMLButtonElement;
    expect(people.getAttribute('aria-checked')).toBe('true');
    expect(
      people.hasAttribute('disabled') ||
        people.getAttribute('aria-disabled') === 'true' ||
        people.hasAttribute('data-disabled'),
    ).toBe(true);
    expect(screen.getByText('workflows.viaAnyStatus')).toBeTruthy();
    // The cell's own entry names the system only; clearing it leaves `* → *` alone.
    fireEvent.click(
      screen.getByRole('checkbox', { name: /workflows\.actors\.system/u }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'workflows.save' }));
    await waitFor(() =>
      expect(api.calls.some((call) => call.method === 'PATCH')).toBe(true),
    );
    const body = api.calls.find((call) => call.method === 'PATCH')?.json as {
      definition: WorkflowDefinition;
    };
    expect(body.definition.transitions).toEqual([
      { from: '*', to: '*', actors: ['user'] },
    ]);
  });
});

describe('kinds in the matrix', () => {
  it('offers every kind the server registered, by its title', async () => {
    const viewer = me('admin');
    resetApi({
      ...noWakes,
      'projects/me': () => ({
        data: {
          ...viewer,
          kinds: [
            ...viewer.kinds,
            { key: 'bot', title: 'Bots', executor: true, mentionable: false },
          ],
        },
      }),
      'projects/workflows': () => ({ data: [software] }),
    });
    renderDetail();
    await startEditing();
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.cellLabel(from=status.todo,to=status.in_progress)',
      }),
    );
    expect(await screen.findByRole('checkbox', { name: /Bots/u })).toBeTruthy();
    expect(
      screen.queryByRole('checkbox', { name: /workflows\.actors\.agent/u }),
    ).toBeNull();
  });
});

describe('the workflow editor', () => {
  it('adds a status, changes who may move and saves the whole definition', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [software] }),
      'PATCH projects/workflows/wf1': () => ({ data: software }),
    });
    renderDetail();
    await startEditing();

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.newStatusIn(category=workflows.categories.started.title)',
      }),
    );
    const newStatus = await screen.findByRole('textbox', {
      name: 'workflows.newStatusName(category=workflows.categories.started.title)',
    });
    fireEvent.change(newStatus, { target: { value: 'QA check' } });
    fireEvent.submit(newStatus.closest('form') as HTMLFormElement);
    expect(
      await screen.findByRole('button', {
        name: 'workflows.editStatus(name=QA check)',
      }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'workflows.cellLabel(from=status.in_review,to=status.done)',
      }),
    );
    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: /workflows\.actors\.system/u,
      }),
    );
    fireEvent.click(
      screen.getByRole('switch', { name: /workflows\.peopleAnywhere/u }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'workflows.save' }));

    await waitFor(() =>
      expect(api.calls.some((call) => call.method === 'PATCH')).toBe(true),
    );
    const body = api.calls.find((call) => call.method === 'PATCH')?.json as {
      revision: number;
      name?: string;
      definition: WorkflowDefinition;
    };
    expect(body.revision).toBe(3);
    // The built-in name was not touched, so it is not sent.
    expect(body).not.toHaveProperty('name');
    expect(body.definition.states).toContainEqual({
      key: 'qa_check',
      name: 'QA check',
      category: 'started',
      color: 'gray',
    });
    expect(body.definition.transitions).toEqual([
      { from: 'todo', to: 'in_progress', actors: ['system'] },
      { from: 'in_review', to: 'done', actors: ['system'] },
    ]);
  });

  it('edits a status on the flow strip: rename, recolor, move, and no removal of a built-in', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [software] }),
      'PATCH projects/workflows/wf1': () => ({ data: software }),
    });
    renderDetail();
    await startEditing();
    const flow = screen.getByRole('region', { name: 'workflows.flowTitle' });
    // The edit mode keeps the diagram: no long list of name inputs on the page, and each column closes with "+".
    expect(within(flow).queryAllByRole('textbox')).toHaveLength(0);
    for (const category of ['unstarted', 'started', 'done', 'closed'])
      expect(
        within(
          within(flow).getByRole('list', {
            name: `workflows.categories.${category}.title`,
          }).parentElement as HTMLElement,
        ).getByRole('button', {
          name: `workflows.newStatusIn(category=workflows.categories.${category}.title)`,
        }),
      ).toBeTruthy();

    // A built-in status can be renamed, recolored and moved, but not removed.
    fireEvent.click(
      within(flow).getByRole('button', {
        name: 'workflows.editStatus(name=status.in_progress)',
      }),
    );
    const name = await screen.findByRole('textbox', {
      name: 'workflows.statusName(name=status.in_progress)',
    });
    expect(
      screen.queryByRole('button', {
        name: 'workflows.removeStatus(name=status.in_progress)',
      }),
    ).toBeNull();
    fireEvent.change(name, { target: { value: 'Discovery' } });
    fireEvent.click(await screen.findByRole('radio', { name: 'colors.blue' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'workflows.moveLater(name=Discovery)',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'workflows.save' }));

    await waitFor(() =>
      expect(api.calls.some((call) => call.method === 'PATCH')).toBe(true),
    );
    const body = api.calls.find((call) => call.method === 'PATCH')?.json as {
      definition: WorkflowDefinition;
    };
    const started = body.definition.states
      .filter((state) => state.category === 'started')
      .map((state) => state.key);
    expect(started.slice(2, 4)).toEqual(['in_review', 'in_progress']);
    expect(
      body.definition.states.find((state) => state.key === 'in_progress'),
    ).toMatchObject({ name: 'Discovery', color: 'blue' });
  });

  it('removes a status the workflow added', async () => {
    const custom: WorkflowListItem = {
      ...software,
      definition: {
        ...definition,
        states: [
          ...definition.states,
          { key: 'qa', name: 'QA', category: 'started', color: 'gray' },
        ],
        transitions: [
          ...definition.transitions,
          { from: 'qa', to: 'done', actors: ['system'] },
        ],
      },
    };
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [custom] }),
      'PATCH projects/workflows/wf1': () => ({ data: custom }),
    });
    renderDetail();
    await startEditing();
    fireEvent.click(
      screen.getByRole('button', { name: 'workflows.editStatus(name=QA)' }),
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.removeStatus(name=QA)',
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'workflows.editStatus(name=QA)' }),
      ).toBeNull(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'workflows.save' }));
    await waitFor(() =>
      expect(api.calls.some((call) => call.method === 'PATCH')).toBe(true),
    );
    const body = api.calls.find((call) => call.method === 'PATCH')?.json as {
      definition: WorkflowDefinition;
    };
    expect(body.definition.states.some((state) => state.key === 'qa')).toBe(
      false,
    );
    expect(
      body.definition.transitions.some(
        (transition) => transition.from === 'qa',
      ),
    ).toBe(false);
  });

  it('shows the workflow read-only without pm.workflows update', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('member') }),
      'projects/workflows': () => ({ data: [software] }),
    });
    renderDetail();
    expect(await screen.findByText(/workflows\.readOnly/u)).toBeTruthy();
    expect(
      screen.getByRole('region', { name: 'workflows.matrix' }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'workflows.edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'workflows.save' })).toBeNull();
    expect(
      screen.queryByRole('button', {
        name: 'workflows.cellLabel(from=status.todo,to=status.done)',
      }),
    ).toBeNull();
  });
});

function renderList(): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/config/workflows']}>
        <Routes>
          <Route path='/config/workflows' element={<WorkflowsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('the workflow list', () => {
  it('says there are none and that projects use the built-in statuses', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [] }),
    });
    renderList();
    expect(await screen.findByText('workflows.empty')).toBeTruthy();
    expect(screen.getByText('workflows.emptyDescription')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('tells a reader without pm.workflows update only what projects use', async () => {
    resetApi({
      'projects/me': () => ({ data: me('member') }),
      'projects/workflows': () => ({ data: [] }),
    });
    renderList();
    expect(await screen.findByText('workflows.emptyReadOnly')).toBeTruthy();
    expect(screen.queryByText('workflows.new')).toBeNull();
  });

  it('starts the first workflow from the built-in statuses', async () => {
    resetApi({
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [] }),
      'POST projects/workflows': () => ({
        data: { ...software, id: 'wf2', name: 'Ours', isDefault: false },
      }),
    });
    renderList();
    // The header and the empty state both offer it.
    const [create] = await screen.findAllByRole('button', {
      name: 'workflows.new',
    });
    fireEvent.click(create!);
    fireEvent.change(await screen.findByLabelText('workflows.name'), {
      target: { value: 'Ours' },
    });
    expect(screen.getByLabelText('workflows.copyFrom').textContent).toContain(
      'workflows.builtInStatuses',
    );
    fireEvent.click(screen.getByText('common.create'));
    await waitFor(() =>
      expect(api.calls.find((call) => call.method === 'POST')?.json).toEqual({
        name: 'Ours',
        copyFrom: null,
      }),
    );
  });

  it('marks only the default, and offers the others to become it', async () => {
    resetApi({
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({
        data: [
          software,
          { ...software, id: 'wf2', name: 'Other', isDefault: false },
        ],
      }),
    });
    renderList();
    await screen.findByText('Other');
    expect(screen.getAllByText('workflows.default')).toHaveLength(1);
    expect(
      screen.getByLabelText('workflows.makeDefault(name=Other)'),
    ).toBeTruthy();
    expect(
      screen.queryByLabelText('workflows.makeDefault(name=Release train)'),
    ).toBeNull();
  });
});

describe('rules on entering a status', () => {
  it('adds a checklist and a notification to a status and saves them with the workflow', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [software] }),
      'PATCH projects/workflows/wf1': () => ({ data: software }),
    });
    renderDetail();
    await startEditing();

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.rules.edit(name=status.in_review)',
      }),
    );
    expect(
      within(await screen.findByRole('dialog')).getByText(
        'workflows.rules.empty',
      ),
    ).toBeTruthy();
    // Picking a type adds it with its first settings, expanded to edit.
    await addRule('checklist');
    fireEvent.change(
      await screen.findByRole('textbox', {
        name: 'workflows.rules.itemLabel(position=1)',
      }),
      { target: { value: 'Tests pass' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'workflows.rules.addItem' }),
    );
    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'workflows.rules.itemLabel(position=2)',
      }),
      { target: { value: 'Notes' } },
    );
    fireEvent.click(
      screen.getAllByRole('checkbox', { name: 'workflows.rules.required' })[1],
    );
    const checklist = document.querySelector(
      '[data-rule-type="checklist"]',
    ) as HTMLElement;
    expect(checklist.textContent).toContain(
      'workflows.ruleChecklistShort(count=2,required=1)',
    );
    // Once on, a type is not offered again.
    expect(await addable()).not.toContain('checklist');
    await addRule('notifyOwner');
    fireEvent.change(
      await screen.findByRole('textbox', { name: 'workflows.rules.message' }),
      { target: { value: 'Please review' } },
    );
    expect(
      document.querySelector('[data-rule-type="notifyOwner"]')?.textContent,
    ).toContain('workflows.ruleNotifyOwnerWith(message=Please review');
    fireEvent.click(
      screen.getByRole('button', { name: 'workflows.rules.done' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'workflows.save' }));

    await waitFor(() =>
      expect(api.calls.some((call) => call.method === 'PATCH')).toBe(true),
    );
    const body = api.calls.find((call) => call.method === 'PATCH')?.json as {
      definition: WorkflowDefinition;
    };
    expect(
      body.definition.states.find((state) => state.key === 'in_review')?.rules,
    ).toEqual([
      {
        type: 'checklist',
        config: {
          items: [
            { key: 'item_1', label: 'Tests pass', required: true },
            { key: 'item_2', label: 'Notes', required: false },
          ],
        },
      },
      { type: 'notifyOwner', config: { message: 'Please review' } },
    ]);
  });

  it('makes a status wait for sub-issues and blockers, but never a closed one', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [software] }),
      'PATCH projects/workflows/wf1': () => ({ data: software }),
    });
    renderDetail();
    await startEditing();

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.rules.edit(name=status.cancelled)',
      }),
    );
    const closed = await addable();
    expect(closed).toContain('blockersDone');
    expect(closed).not.toContain('subtasksDone');
    fireEvent.click(
      screen.getByRole('button', { name: 'workflows.rules.done' }),
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.rules.edit(name=status.done)',
      }),
    );
    await addRule('subtasksDone');
    await addRule('blockersDone');
    await addRule('notifyOwner');
    // A rule is removed from its card.
    fireEvent.click(
      screen.getByRole('button', {
        name: 'workflows.rules.remove(title=workflows.rules.notifyOwner)',
      }),
    );
    expect(document.querySelector('[data-rule-type="notifyOwner"]')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'workflows.rules.done' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'workflows.save' }));

    await waitFor(() =>
      expect(api.calls.some((call) => call.method === 'PATCH')).toBe(true),
    );
    const body = api.calls.find((call) => call.method === 'PATCH')?.json as {
      definition: WorkflowDefinition;
    };
    expect(
      body.definition.states.find((state) => state.key === 'done')?.rules,
    ).toEqual([{ type: 'subtasksDone' }, { type: 'blockersDone' }]);
  });
});

describe('approvals in the transitions matrix', () => {
  it('clears the approvers when approval is turned off', async () => {
    const withApproval = {
      ...software,
      definition: {
        ...software.definition,
        transitions: [
          ...software.definition.transitions,
          {
            from: 'in_review',
            to: 'done',
            actors: ['user'],
            approval: { approvers: ['owner'] },
          },
        ],
      },
    } as typeof software;
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [withApproval] }),
      'PATCH projects/workflows/wf1': () => ({ data: withApproval }),
    });
    renderDetail();
    await startEditing();
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.cellLabel(from=status.in_review,to=status.done)',
      }),
    );
    const owner = await screen.findByRole('checkbox', {
      name: 'workflows.approvers.owner',
    });
    expect(owner.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(
      screen.getByRole('button', { name: 'workflows.approvalNone' }),
    );
    expect(
      screen.queryByRole('checkbox', { name: 'workflows.approvers.owner' }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'workflows.save' }));
    await waitFor(() =>
      expect(api.calls.some((call) => call.method === 'PATCH')).toBe(true),
    );
    const body = api.calls.find((call) => call.method === 'PATCH')?.json as {
      definition: WorkflowDefinition;
    };
    expect(
      body.definition.transitions.some((transition) => transition.approval),
    ).toBe(false);
  });

  it('makes a move wait for the chosen approvers', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [software] }),
      'PATCH projects/workflows/wf1': () => ({ data: software }),
    });
    renderDetail();
    await startEditing();
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.cellLabel(from=status.in_review,to=status.done)',
      }),
    );
    // Approvers appear only once approval is turned on.
    expect(
      screen.queryByRole('checkbox', {
        name: 'workflows.approvers.projectLead',
      }),
    ).toBeNull();
    fireEvent.click(
      await screen.findByRole('button', { name: 'workflows.approvalRequired' }),
    );
    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: 'workflows.approvers.projectLead',
      }),
    );
    expect(await screen.findAllByText('workflows.approval')).not.toHaveLength(
      0,
    );
    fireEvent.click(screen.getByRole('button', { name: 'workflows.save' }));
    await waitFor(() =>
      expect(api.calls.some((call) => call.method === 'PATCH')).toBe(true),
    );
    const body = api.calls.find((call) => call.method === 'PATCH')?.json as {
      definition: WorkflowDefinition;
    };
    expect(body.definition.transitions).toContainEqual({
      from: 'in_review',
      to: 'done',
      actors: ['user'],
      approval: { approvers: ['projectLead'] },
    });
  });
});

describe('the workflow model', () => {
  it('shows what a wider entry allows as implied, not as set', () => {
    expect(impliedActorsAt(definition, 'todo', 'in_progress')).toEqual([
      'user',
    ]);
    const narrowed = setActorsAt(definition, 'todo', 'in_progress', []);
    expect(narrowed.transitions).toEqual([
      { from: '*', to: '*', actors: ['user'] },
    ]);
  });

  it('derives a free key from the name', () => {
    expect(keyFor('In QA!', new Set())).toBe('in_qa');
    expect(keyFor('测试中', new Set(['status']))).toBe('status_2');
  });

  it('moves a status only among its category', () => {
    const moved = moveStatus(definition, 'in_review', -1);
    expect(moved.states.map((state) => state.key).slice(4, 7)).toEqual([
      'in_review',
      'in_progress',
      'blocked',
    ]);
    expect(moveStatus(definition, 'analysis', -1)).toBe(definition);
  });

  it('orders statuses by category, draws only concrete transitions, and states wildcards in words', () => {
    const order = flowOrder(definition).map((state) => state.key);
    expect(order.at(-1)).toBe('cancelled');
    expect(order.at(-2)).toBe('done');
    const mixed: WorkflowDefinition = {
      ...definition,
      transitions: [
        ...definition.transitions,
        { from: 'todo', to: 'in_progress', actors: ['user'] },
        { from: '*', to: 'done', actors: ['system'] },
        {
          from: 'in_review',
          to: 'done',
          actors: ['user'],
          approval: { approvers: ['owner'] },
        },
      ],
    };
    expect(explicitEdges(mixed)).toEqual([
      {
        from: 'todo',
        to: 'in_progress',
        actors: ['user', 'system'],
        approval: null,
      },
      { from: 'in_review', to: 'done', actors: ['user'], approval: ['owner'] },
    ]);
    expect(wildcardMoves(mixed)).toEqual([
      { actor: 'user', moves: [{ from: '*', to: '*', approval: null }] },
      { actor: 'system', moves: [{ from: '*', to: 'done', approval: null }] },
    ]);
    const fromReview = reachableFrom(mixed, 'in_review');
    expect(fromReview.find((cell) => cell.to === 'done')).toEqual({
      to: 'done',
      actors: ['user', 'system'],
      approval: ['owner'],
    });
    expect(fromReview.some((cell) => cell.to === 'in_review')).toBe(false);
    const withApproval: WorkflowDefinition = {
      ...definition,
      transitions: [
        ...definition.transitions,
        {
          from: '*',
          to: 'done',
          actors: ['system'],
          approval: { approvers: ['admin', 'owner'] },
        },
      ],
    };
    expect(
      transitionCell(withApproval.transitions, 'in_review', 'done'),
    ).toEqual({ actors: ['user', 'system'], approval: ['owner', 'admin'] });
    expect(workflowRules(withApproval)[0]).toMatchObject({
      kind: 'transition',
      from: '*',
      to: 'done',
    });
  });
});

/** A rule type another plugin would contribute: its summary names the target, its editor sets it. */
const pingType: StatusRuleTypeUI = {
  type: 'ping',
  title: { key: 'ping.title', ns: 'other' },
  hint: 'Pings someone on entering.',
  categories: ['unstarted', 'started'],
  initialConfig: { target: 'bob' },
  Editor: ({ config, onChange, idPrefix }: StatusRuleEditorProps) => (
    <input
      aria-label='Ping target'
      id={`${idPrefix}-target`}
      value={String(config.target ?? '')}
      onChange={(event) => onChange({ target: event.target.value })}
    />
  ),
  Summary: ({ config, status }: StatusRuleSummaryProps) => (
    <span>{`Pings ${String(config.target)} on ${status.name}`}</span>
  ),
};

describe('rules other plugins contribute', () => {
  const withRules: WorkflowListItem = {
    ...software,
    definition: {
      ...definition,
      states: definition.states.map((state) =>
        state.key === 'in_progress'
          ? { ...state, rules: [{ type: 'ping', config: { target: 'ann' } }] }
          : state.key === 'in_review'
            ? { ...state, rules: [{ type: 'gone', config: { x: 1 } }] }
            : state,
      ),
    },
  };

  it('shows a contributed rule by its summary and a rule whose plugin is gone as unavailable', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [withRules] }),
    });
    renderDetail([pingType]);

    const rules = await screen.findByRole('region', {
      name: 'workflows.rulesTitle',
    });
    expect(
      within(rules).getByText('Pings ann on status.in_progress'),
    ).toBeTruthy();
    expect(
      rules.querySelector('[data-rule-unavailable="gone"]')?.textContent,
    ).toBe('workflows.rules.unavailableShort(type=gone)');
  });

  it('edits a contributed rule with its own editor and removes an unavailable one', async () => {
    resetApi({
      ...noWakes,
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [withRules] }),
      'PATCH projects/workflows/wf1': () => ({ data: withRules }),
    });
    renderDetail([pingType]);
    await startEditing();

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.rules.edit(name=status.todo)',
      }),
    );
    await addRule('ping');
    fireEvent.change(
      await screen.findByRole('textbox', { name: 'Ping target' }),
      {
        target: { value: 'carol' },
      },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'workflows.rules.done' }),
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.rules.edit(name=status.in_review)',
      }),
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.rules.removeUnavailable(type=gone)',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'workflows.rules.done' }),
    );
    // A closed status does not offer the type.
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.rules.edit(name=status.cancelled)',
      }),
    );
    expect(await addable()).not.toContain('ping');
    fireEvent.click(
      screen.getByRole('button', { name: 'workflows.rules.done' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'workflows.save' }));
    await waitFor(() =>
      expect(api.calls.some((call) => call.method === 'PATCH')).toBe(true),
    );
    const body = api.calls.find((call) => call.method === 'PATCH')?.json as {
      definition: WorkflowDefinition;
    };
    const rulesOf = (key: string) =>
      body.definition.states.find((state) => state.key === key)?.rules;
    expect(rulesOf('todo')).toEqual([
      { type: 'ping', config: { target: 'carol' } },
    ]);
    expect(rulesOf('in_progress')).toEqual([
      { type: 'ping', config: { target: 'ann' } },
    ]);
    expect(rulesOf('in_review')).toBeUndefined();
  });

  it('asks before saving a change that wakes someone without confirmation', async () => {
    resetApi({
      'projects/me': () => ({ data: me('admin') }),
      'projects/workflows': () => ({ data: [software] }),
      'POST projects/workflows/wf1/preview': () => ({
        data: {
          rules: [],
          attention: [
            {
              statusKey: 'todo',
              rule: { type: 'ping', config: { target: 'bob' } },
              summary: 'Pings someone.',
              isNew: true,
            },
          ],
        },
      }),
      'PATCH projects/workflows/wf1': () => ({ data: software }),
    });
    renderDetail([pingType]);
    await startEditing();
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'workflows.rules.edit(name=status.todo)',
      }),
    );
    await addRule('ping');
    fireEvent.click(
      screen.getByRole('button', { name: 'workflows.rules.done' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'workflows.save' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText('workflows.wakeConfirm.title'),
    ).toBeTruthy();
    expect(within(dialog).getByText('Pings bob on status.todo')).toBeTruthy();
    expect(api.calls.some((call) => call.method === 'PATCH')).toBe(false);
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'workflows.wakeConfirm.confirm',
      }),
    );
    await waitFor(() =>
      expect(api.calls.some((call) => call.method === 'PATCH')).toBe(true),
    );
  });
});
