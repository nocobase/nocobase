import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api, clientMocks, me, resetApi } from './fake-client.js';
import {
  ExecutorPresentationContext,
  type ExecutorPresentationProps,
} from '../../client/kit/executor-presentation.js';
import { renderAt } from './render.js';
import { IssueCreationModeContext } from '../../client/kit/issue-creation.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: NewIssuePage } =
  await import('../../client/pages/issues/new.js');
const { NewIssueButton } =
  await import('../../client/pages/issues/new-issue-button.js');

function QuotaExecutor({
  name,
  place,
}: ExecutorPresentationProps): ReactElement {
  return (
    <span>
      {name} quota detail {place}
    </span>
  );
}

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
  it('lets applications retain a manual form even when an AI tab was requested', async () => {
    renderAt('/issues/new?tab=ai', [
      {
        path: '/issues/new',
        element: (
          <IssueCreationModeContext.Provider value='manual'>
            <NewIssuePage />
          </IssueCreationModeContext.Provider>
        ),
      },
      { path: '*', element: <p>list</p> },
    ]);
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('issueForm.titleLabel'), {
      target: { value: 'Manual fallback' },
    });
    fireEvent.click(within(dialog).getByText('actions.cancel'));
    expect(await screen.findByText('unsavedChanges.title')).toBeTruthy();
  });
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

  it('lets the application describe an executor without changing the offered candidates', async () => {
    api.routes['projects/me'] = () => ({ data: withAgents() });
    const view = renderAt('/issues/new?tab=manual', [
      {
        path: '/issues/new',
        element: (
          <ExecutorPresentationContext.Provider
            value={{
              kind: 'agent',
              Component: QuotaExecutor,
            }}
          >
            <NewIssuePage />
          </ExecutorPresentationContext.Provider>
        ),
      },
    ]);
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByLabelText('properties.executor'));
    expect(await screen.findByText('Coder quota detail menu')).toBeVisible();
    expect(screen.queryByText('Unregistered agent')).toBeNull();
    view.unmount();
  });
  it('starts now by default, or later in backlog, and keeps the default executor to the server', async () => {
    api.routes['projects/me'] = () => ({ data: withAgents() });
    api.routes['projects/executors'] = () => ({
      data: [
        { type: 'agent', id: 'pm', name: 'Project manager', isDefault: true },
        { type: 'agent', id: 'a1', name: 'Coder' },
      ],
    });
    const created: unknown[] = [];
    api.routes['POST projects/issues'] = (request) => {
      created.push(request.json);
      return { data: { id: 'i1', identifier: 'PM-1' } };
    };
    renderNewIssue();
    const dialog = await screen.findByRole('dialog');
    // The default executor is shown as chosen.
    await waitFor(() =>
      expect(
        within(dialog).getByLabelText('properties.executor').textContent,
      ).toContain('Project manager'),
    );
    expect(within(dialog).getByText('issueForm.createAndStart')).toBeTruthy();
    fireEvent.change(within(dialog).getByLabelText('issueForm.titleLabel'), {
      target: { value: 'Now' },
    });
    fireEvent.click(within(dialog).getByText('issueForm.createAndStart'));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({
      title: 'Now',
      statusKey: 'in_progress',
    });
    // Left as it was, the executor goes to the server's default.
    expect(created[0]).not.toHaveProperty('executor');
  });

  it('creates a later issue in backlog', async () => {
    const created: unknown[] = [];
    api.routes['POST projects/issues'] = (request) => {
      created.push(request.json);
      return { data: { id: 'i1', identifier: 'PM-1' } };
    };
    renderNewIssue();
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('issueForm.titleLabel'), {
      target: { value: 'Later' },
    });
    await userEvent.click(within(dialog).getByText('issueForm.startLater'));
    await waitFor(() =>
      expect(within(dialog).getByText('common.create')).toBeTruthy(),
    );
    fireEvent.click(within(dialog).getByText('common.create'));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({ title: 'Later', statusKey: 'backlog' });
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

it('pastes an image at the caret, blocks creation until upload finishes, and binds it on creation', async () => {
  let finish!: (value: unknown) => void;
  api.routes['POST projects/attachments'] = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  api.routes['POST projects/issues'] = () => ({
    data: { id: 'i1', identifier: 'PM-1' },
  });
  renderNewIssue();
  const description = await screen.findByRole('textbox', {
    name: 'issueForm.descriptionLabel',
  });
  fireEvent.change(screen.getByLabelText('issueForm.titleLabel'), {
    target: { value: 'Screenshot' },
  });
  description.focus();
  fireEvent.paste(description, {
    clipboardData: {
      files: [new File(['png'], 'image.png', { type: 'image/png' })],
      getData: () => '',
      types: ['Files'],
    },
  });
  await waitFor(() => expect(finish).toBeTypeOf('function'));
  expect(
    screen
      .getByRole('button', { name: 'issueForm.createAndStart' })
      .hasAttribute('disabled'),
  ).toBe(true);
  finish({
    data: {
      id: 'f1',
      filename: 'shot.png',
      contentUrl: '/api/projects/attachments/f1/content',
      previewable: true,
    },
  });
  await waitFor(() =>
    expect(description.querySelector('img')?.getAttribute('src')).toBe(
      '/api/projects/attachments/f1/content',
    ),
  );
  fireEvent.submit(document.getElementById('pm-issue-new-form')!);
  await waitFor(() =>
    expect(
      api.calls.find(
        (call) => call.method === 'POST' && call.path === 'projects/issues',
      )?.json,
    ).toMatchObject({
      attachmentIds: ['f1'],
      description: expect.stringContaining(
        '![shot.png](/api/projects/attachments/f1/content)',
      ),
    }),
  );
});
