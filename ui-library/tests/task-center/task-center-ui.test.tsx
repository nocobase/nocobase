import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import {
  TaskSourceNav,
  matchesTaskStatusTab,
  taskCenterUiLocaleEnUS,
  taskCenterUiLocaleZhCN,
} from '../../registry/task-center/task-center-ui';
import { TaskCenterUiDemo } from '../../website/demo/task-center';

// The block's own locales in a strict runtime: a key they lack fails the test instead of rendering its English
// default. Everything else on screen comes translated in the data.
async function runtime(locale: 'en-US' | 'zh-CN') {
  return createTestI18nRuntime({
    locale,
    application: {
      namespace: '@nocobase/ui-library',
      resources:
        locale === 'en-US' ? taskCenterUiLocaleEnUS : taskCenterUiLocaleZhCN,
    },
  });
}

const english = await runtime('en-US');
const chinese = await runtime('zh-CN');

function renderDemo(): ReturnType<typeof userEvent.setup> {
  render(
    <TestI18nProvider runtime={english}>
      <TaskCenterUiDemo />
    </TestI18nProvider>,
  );
  return userEvent.setup();
}

function navigation(): HTMLElement {
  return screen.getByRole('navigation', { name: 'Task sources' });
}

function card(title: string): HTMLElement {
  return screen.getByRole('button', { name: title }).closest('li')!;
}

describe('task-center-ui', () => {
  it('keeps the navigation on pending counts whichever tab is selected', async () => {
    const user = renderDemo();
    const source = within(navigation()).getByRole('button', {
      name: /^Waiting for my approval/,
    });
    expect(within(source).getByLabelText('6 to do')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: /All/ }));
    expect(within(source).getByLabelText('6 to do')).toBeTruthy();
    expect(screen.getByText('Page 1 of 2, 9 tasks')).toBeTruthy();
  });

  it('filters subjects by name and unfolds every source with a match', async () => {
    const user = renderDemo();
    await user.type(
      within(navigation()).getByRole('searchbox', {
        name: 'Search task types',
      }),
      'leave',
    );
    expect(
      within(navigation()).getAllByRole('button', { name: /^Leave/ }),
    ).toHaveLength(3);
    expect(
      within(navigation()).queryByRole('button', { name: /Work items/ }),
    ).toBeNull();

    await user.clear(within(navigation()).getByRole('searchbox'));
    await user.type(within(navigation()).getByRole('searchbox'), 'nothing');
    expect(screen.getByText('No task type matches')).toBeTruthy();
  });

  it('selects one type at a time and locks the others until the selection is empty', async () => {
    const user = renderDemo();
    await user.click(
      within(card('Annual leave for Li Na')).getByRole('checkbox'),
    );

    const expense = within(
      card('Travel expenses of Ming Chen (client visit)'),
    ).getByRole('checkbox');
    expect(expense.getAttribute('aria-disabled')).toBe('true');
    expect(expense.getAttribute('title')).toBe(
      'Leave is selected; only tasks of one type can be selected together',
    );
    expect(
      within(card('Annual logistics service contract, East region'))
        .getByRole('checkbox')
        .getAttribute('title'),
    ).toBe('Tasks of this type are handled one at a time');

    const toolbar = screen.getByRole('toolbar', { name: 'Batch actions' });
    expect(within(toolbar).getByText('1 selected')).toBeTruthy();
    // The toolbar takes the tabs' place rather than pushing the list down.
    expect(screen.queryByRole('tab', { name: /To do/ })).toBeNull();

    await user.click(
      within(toolbar).getByRole('button', { name: 'Clear selection' }),
    );
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(
      within(card('Travel expenses of Ming Chen (client visit)'))
        .getByRole('checkbox')
        .getAttribute('aria-disabled'),
    ).toBeNull();
  });

  it('confirms a batch action with its tasks, then moves them out of To do', async () => {
    const user = renderDemo();
    await user.click(
      within(card('Annual leave for Li Na')).getByRole('checkbox'),
    );
    await user.click(
      within(card('Sick leave for Wang Wei')).getByRole('checkbox'),
    );
    await user.click(screen.getByRole('button', { name: 'Approve (2)' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Approve 2 requests?')).toBeTruthy();
    expect(within(dialog).getByText('Sick leave for Wang Wei')).toBeTruthy();
    await user.click(
      within(dialog).getByRole('button', { name: 'Approve (2)' }),
    );

    await waitFor(() =>
      expect(screen.queryByText('Annual leave for Li Na')).toBeNull(),
    );
    expect(
      within(navigation()).getByRole('button', {
        name: /^Waiting for my approval/,
      }).textContent,
    ).toContain('4');
  });

  it('opens a card in the drawer with the form its type contributes', async () => {
    const user = renderDemo();
    await user.click(
      screen.getByRole('button', { name: 'R&D purchase: test servers' }),
    );
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText('Rack test server')).toBeTruthy();

    await user.click(within(drawer).getByRole('button', { name: 'Reject' }));
    expect(within(drawer).getByText('Say why you reject it.')).toBeTruthy();

    await user.click(within(drawer).getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByText('R&D purchase: test servers: Approved'),
    ).toBeTruthy();
  });

  it('translates its own chrome', () => {
    function Nav(): ReactElement {
      return (
        <TaskSourceNav
          sources={[
            {
              key: 'approval.task',
              label: '待我审批',
              count: 2,
              subjects: [{ key: 'leave', label: '请假', count: 2 }],
            },
          ]}
          source='approval.task'
          onSelect={() => undefined}
        />
      );
    }
    render(
      <TestI18nProvider runtime={chinese}>
        <Nav />
      </TestI18nProvider>,
    );
    expect(screen.getByRole('navigation', { name: '待办来源' })).toBeTruthy();
    expect(screen.getByPlaceholderText('搜索事项类型')).toBeTruthy();
    expect(screen.getAllByLabelText('2 项待办')).toHaveLength(2);
  });

  it('puts completed and cancelled tasks under Done', () => {
    expect(matchesTaskStatusTab('cancelled', 'closed')).toBe(true);
    expect(matchesTaskStatusTab('pending', 'closed')).toBe(false);
    expect(matchesTaskStatusTab('completed', 'all')).toBe(true);
  });
});
