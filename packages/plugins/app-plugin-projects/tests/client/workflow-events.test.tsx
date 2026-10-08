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
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';

import {
  BUILTIN_STATUSES,
  type WorkflowDefinition,
  type WorkflowListItem,
} from '../../shared/workflows.js';
import type { WorkflowEventUI } from '../../client/lib/workflow-events.js';
import { api, clientMocks, me, resetApi } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: WorkflowDetailPage } =
  await import('../../client/pages/config/workflow-detail.js');
const { WorkflowEventsContext } =
  await import('../../client/lib/workflow-events.js');

afterEach(cleanup);

const merged: WorkflowEventUI = {
  key: 'test.merged',
  title: 'Pull request merged',
  hint: 'When every pull request of the issue is merged.',
  from: ['started'],
  to: ['done'],
};

const definition: WorkflowDefinition = {
  states: BUILTIN_STATUSES,
  transitions: [
    { from: '*', to: '*', actors: ['user'] },
    { from: 'in_review', to: 'done', actors: ['system'], on: 'test.merged' },
    {
      from: 'in_progress',
      to: 'blocked',
      actors: ['system'],
      on: 'gone.event',
    },
  ],
};

const workflow: WorkflowListItem = {
  id: 'wf1',
  name: 'Release train',
  description: null,
  isDefault: true,
  builtInKey: null,
  definition,
  revision: 3,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
  projectCount: 1,
};

function renderDetail(events: readonly WorkflowEventUI[]): void {
  resetApi({
    'POST projects/workflows/wf1/preview': () => ({
      data: { rules: [], attention: [] },
    }),
    'projects/me': () => ({ data: me('admin') }),
    'projects/workflows': () => ({ data: [workflow] }),
    'PATCH projects/workflows/wf1': () => ({ data: workflow }),
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <WorkflowEventsContext.Provider value={events}>
        <MemoryRouter initialEntries={['/config/workflows/wf1']}>
          <Routes>
            <Route path='/config/workflows' element={<Outlet />}>
              <Route path=':workflowId' element={<WorkflowDetailPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </WorkflowEventsContext.Provider>
    </QueryClientProvider>,
  );
}

async function openRules(status: string): Promise<HTMLElement> {
  fireEvent.click(
    await screen.findByRole('button', {
      name: `workflows.rules.edit(name=status.${status})`,
    }),
  );
  return screen.findByRole('dialog');
}

/** What the open rules dialog's "Add rule" menu offers, by key. */
async function addable(dialog: HTMLElement): Promise<string[]> {
  // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
  await userEvent.click(
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

describe('workflow events other plugins contribute, in the editor', () => {
  it('states each move on an event by the event title, and marks one whose plugin is gone', async () => {
    renderDetail([merged]);
    const rules = await screen.findByRole('region', {
      name: 'workflows.rulesTitle',
    });
    expect(
      within(rules).getByText(
        'workflows.autoMove.eventRule(event=Pull request merged,from=status.in_review,to=status.done)',
      ),
    ).toBeTruthy();
    const gone = rules.querySelector('[data-auto-move="in_progress"]');
    expect(gone?.textContent).toContain(
      'workflows.autoMove.eventRule(event=gone.event,from=status.in_progress,to=status.blocked)',
    );
    expect(gone?.textContent).toContain('workflows.autoMove.unavailableShort');
  });

  it('offers a contributed event on the statuses it may leave, beside the built-in one', async () => {
    renderDetail([merged]);
    fireEvent.click(
      await screen.findByRole('button', { name: 'workflows.edit' }),
    );

    const review = await openRules('in_review');
    // The move the workflow has is a card: its title, where it moves the issue, and its settings once expanded.
    const card = review.querySelector(
      '[data-auto-move-event="test.merged"]',
    ) as HTMLElement;
    expect(
      within(card).getByText(
        'workflows.autoMove.eventTitle(event=Pull request merged)',
      ),
    ).toBeTruthy();
    expect(
      within(card).getByText('workflows.autoMove.summary(to=status.done)'),
    ).toBeTruthy();
    expect(within(card).queryByRole('combobox')).toBeNull();
    fireEvent.click(
      within(card).getByRole('button', {
        name: /^workflows\.autoMove\.eventTitle/u,
      }),
    );
    expect(
      await within(card).findByText(
        'When every pull request of the issue is merged.',
      ),
    ).toBeTruthy();
    expect(within(card).getByRole('combobox').textContent).toContain(
      'status.done',
    );
    // The built-in event is offered to add; the one set is not offered again.
    const offered = await addable(review);
    expect(offered).toContain('subtasks.done');
    expect(offered).not.toContain('test.merged');
    fireEvent.click(
      within(review).getByRole('button', { name: 'workflows.rules.done' }),
    );

    // Todo is unstarted: the event may not leave it.
    const todo = await openRules('todo');
    const fromTodo = await addable(todo);
    expect(fromTodo).toContain('subtasks.done');
    expect(fromTodo).not.toContain('test.merged');
    fireEvent.click(
      within(todo).getByRole('button', { name: 'workflows.rules.done' }),
    );
  });

  it('adds an automatic move from the menu, which waits for a target and can be dropped', async () => {
    renderDetail([merged]);
    fireEvent.click(
      await screen.findByRole('button', { name: 'workflows.edit' }),
    );
    const progress = await openRules('in_progress');
    await userEvent.click(
      within(progress).getByRole('button', { name: 'workflows.rules.add' }),
    );
    const item = await waitFor(() => {
      const found = document.querySelector('[data-add-rule="test.merged"]');
      if (!found) throw new Error('not open');
      return found as HTMLElement;
    });
    fireEvent.click(item);
    const card = (await waitFor(() => {
      const found = progress.querySelector(
        '[data-auto-move-event="test.merged"]',
      );
      if (!found) throw new Error('no card');
      return found;
    })) as HTMLElement;
    expect(
      within(card).getAllByText('workflows.autoMove.chooseTarget').length,
    ).toBeGreaterThan(0);
    expect(within(card).getByRole('combobox')).toBeTruthy();
    fireEvent.click(
      within(card).getByRole('button', {
        name: 'workflows.rules.remove(title=workflows.autoMove.eventTitle(event=Pull request merged))',
      }),
    );
    expect(
      progress.querySelector('[data-auto-move-event="test.merged"]'),
    ).toBeNull();
  });

  it('removes a move on an event whose plugin is gone', async () => {
    renderDetail([merged]);
    fireEvent.click(
      await screen.findByRole('button', { name: 'workflows.edit' }),
    );
    const progress = await openRules('in_progress');
    expect(
      progress.querySelector('[data-event-unavailable="gone.event"]'),
    ).not.toBeNull();
    fireEvent.click(
      within(progress).getByRole('button', {
        name: 'workflows.autoMove.removeUnavailable(event=gone.event)',
      }),
    );
    fireEvent.click(
      within(progress).getByRole('button', { name: 'workflows.rules.done' }),
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
      { from: 'in_review', to: 'done', actors: ['system'], on: 'test.merged' },
    ]);
  });

  it('shows no contributed picker without contributed events', async () => {
    renderDetail([]);
    fireEvent.click(
      await screen.findByRole('button', { name: 'workflows.edit' }),
    );
    const review = await openRules('in_review');
    // The saved move stays, offered by key as unavailable.
    expect(
      review.querySelector('[data-auto-move-event="test.merged"]'),
    ).toBeNull();
    expect(
      review.querySelector('[data-event-unavailable="test.merged"]'),
    ).not.toBeNull();
  });
});
