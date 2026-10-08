import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api, clientMocks, me, resetApi } from './fake-client.js';
import { renderAt } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: NewIssuePage } =
  await import('../../client/pages/issues/new.js');
const { NewIssueButton } =
  await import('../../client/pages/issues/new-issue-button.js');

const withAgents = () => {
  const viewer = me('admin');
  return {
    ...viewer,
    kinds: [
      ...viewer.kinds,
      { key: 'agent', title: 'Agent', executor: true, mentionable: true },
    ],
  };
};

beforeEach(() => {
  resetApi({
    'projects/me': () => ({ data: me('admin') }),
    projects: () => ({ data: [] }),
    'projects/labels': () => ({ data: [] }),
    'projects/members': () => ({
      data: [{ userId: 'u1', name: 'Ann', email: null }],
    }),
    'projects/executors': () => ({
      data: [{ type: 'agent', id: 'a1', name: 'Coder' }],
    }),
  });
});
afterEach(cleanup);

const renderNewIssue = (search = '?tab=manual') =>
  renderAt(`/issues/new${search}`, [
    { path: '/issues/new', element: <NewIssuePage /> },
    { path: '*', element: <p>list</p> },
  ]);

const location = () => screen.getByTestId('location').textContent;

describe('the new issue dialog', () => {
  it('closes at once when nothing was entered', async () => {
    renderNewIssue();
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByText('actions.cancel'));
    await waitFor(() => expect(location()).not.toContain('/issues/new'));
    expect(screen.queryByText('unsavedChanges.title')).toBeNull();
  });

  it('asks before discarding what was typed', async () => {
    renderNewIssue();
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('issueForm.titleLabel'), {
      target: { value: 'Draft' },
    });

    fireEvent.click(within(dialog).getByText('actions.cancel'));
    expect(await screen.findByText('unsavedChanges.title')).toBeTruthy();
    fireEvent.click(screen.getByText('unsavedChanges.keepEditing'));
    await waitFor(() =>
      expect(screen.queryByText('unsavedChanges.title')).toBeNull(),
    );
    expect(location()).toBe('/issues/new?tab=manual');

    fireEvent.click(within(dialog).getByText('actions.cancel'));
    fireEvent.click(await screen.findByText('unsavedChanges.discard'));
    await waitFor(() => expect(location()).not.toContain('/issues/new'));
  });

  it('offers agents as executors when the agent kind is registered', async () => {
    api.routes['projects/me'] = () => ({ data: withAgents() });
    renderNewIssue();
    const dialog = await screen.findByRole('dialog');
    await waitFor(() =>
      expect(api.calls.some((call) => call.path === 'projects/executors')).toBe(
        true,
      ),
    );
    // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
    await userEvent.click(within(dialog).getByLabelText('properties.executor'));
    expect(await screen.findByRole('option', { name: /Coder/u })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Ann/u })).toBeTruthy();
  });

  it('does not look for other executors when only people execute', async () => {
    renderNewIssue();
    await screen.findByRole('dialog');
    await waitFor(() =>
      expect(api.calls.some((call) => call.path === 'projects/me')).toBe(true),
    );
    expect(api.calls.some((call) => call.path === 'projects/executors')).toBe(
      false,
    );
  });
});

describe('the AI draft tab', () => {
  beforeEach(() => window.localStorage.clear());

  it('is the default, and the tab chosen last is remembered', async () => {
    const first = renderNewIssue('');
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByTestId('intake-split')).toBeTruthy();
    expect(
      within(dialog).getByLabelText('issueForm.titleLabel'),
    ).not.toBeVisible();
    fireEvent.click(
      within(dialog).getByRole('tab', { name: 'newIssue.tabs.manual' }),
    );
    expect(
      await within(dialog).findByLabelText('issueForm.titleLabel'),
    ).toBeVisible();
    first.unmount();
    renderNewIssue('');
    expect(
      await within(await screen.findByRole('dialog')).findByLabelText(
        'issueForm.titleLabel',
      ),
    ).toBeVisible();
  });
});

describe('the "New issue" button', () => {
  it('shows the "C" hint wherever it is the primary button', () => {
    const { unmount } = renderAt('/issues', [
      { path: '/issues', element: <NewIssueButton /> },
    ]);
    expect(screen.getByText('C')).toBeTruthy();
    unmount();
    renderAt('/my-issues', [
      { path: '/my-issues', element: <NewIssueButton absolute /> },
    ]);
    expect(screen.getByText('issues.new')).toBeTruthy();
    expect(screen.getByText('C')).toBeTruthy();
  });
});
