import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import { IssueToolbar } from '../../client/issues/toolbar.js';
import type { IssuesPage } from '../../client/issues/use-issues-page.js';

it('applies a selection in the filter popover and returns focus when it closes', async () => {
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'studio', resources: locales },
  });
  const setFilter = vi.fn();
  const page = {
    toolbarFilters: [
      {
        key: 'projectId',
        label: 'Project',
        allLabel: 'All projects',
        options: [{ value: 'project-1', label: 'A project' }],
        value: undefined,
      },
    ],
    searchText: '',
    setSearchText: vi.fn(),
    scheduleSearch: vi.fn(),
    searchRef: { current: null },
    setFilter,
    filtered: false,
    clearFilters: vi.fn(),
    view: 'board',
    setView: vi.fn(),
  } as unknown as IssuesPage;

  render(
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <MemoryRouter>
        <IssueToolbar
          page={page}
          fetching={false}
          views={[{ key: 'board', label: 'Board', icon: () => null }]}
        />
      </MemoryRouter>
    </TestI18nProvider>,
  );

  const user = userEvent.setup();
  const trigger = screen.getByRole('button', { name: /^Filters/ });
  await user.click(trigger);
  const popover = screen.getByRole('dialog');
  await user.click(within(popover).getByRole('combobox', { name: 'Project' }));
  await user.click(screen.getByRole('option', { name: 'A project' }));
  expect(setFilter).toHaveBeenCalledWith('projectId', 'project-1');

  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(trigger).toHaveFocus();
});
