import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api, clientMocks, FakeApiError, me, resetApi } from './fake-client.js';
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

describe('files on a new issue', () => {
  const screenshot = () =>
    new File([new Uint8Array([137, 80, 78, 71])], 'image.png', {
      type: 'image/png',
    });
  const stored = (id: string, filename = 'screenshot.png') => ({
    data: {
      id,
      filename,
      ext: 'png',
      mimeType: 'image/png',
      size: 4,
      issueId: null,
      commentId: null,
      uploader: { type: 'user', id: 'u1', name: 'u1' },
      createdAt: '2026-10-10T00:00:00.000Z',
      contentUrl: `/api/projects/attachments/${id}/content`,
      downloadUrl: `/api/projects/attachments/${id}/content?download=true`,
      previewable: true,
      canDelete: true,
    },
  });
  /** Uploads answered when the test says so, in order. */
  const deferredUploads = () => {
    const pending: (() => void)[] = [];
    let count = 0;
    api.routes['POST projects/attachments'] = () => {
      count += 1;
      const id = `f${count}`;
      return new Promise((resolve) => {
        pending.push(() => resolve(stored(id)));
      });
    };
    return { finish: () => pending.shift()?.() };
  };
  const created: unknown[] = [];
  const calls = (method: string, path: string) =>
    api.calls.filter((call) => call.method === method && call.path === path);
  const deleted = () =>
    api.calls
      .filter((call) => call.method === 'DELETE')
      .map((call) => call.path);

  beforeEach(() => {
    created.length = 0;
    api.routes['POST projects/attachments'] = () => stored('f1');
    api.routes['DELETE projects/attachments/f1'] = () => undefined;
    api.routes['POST projects/issues'] = (request) => {
      created.push(request.json);
      return { data: { id: 'i1', identifier: 'PM-1' } };
    };
  });

  async function openForm() {
    renderNewIssue();
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('issueForm.titleLabel'), {
      target: { value: 'Broken login' },
    });
    return dialog;
  }

  const paste = (dialog: HTMLElement, files: File[], text = '') =>
    fireEvent.paste(
      // Hidden from the accessibility tree too, under the "Start now?" dialog.
      within(dialog).getByRole('textbox', {
        name: 'issueForm.descriptionLabel',
        hidden: true,
      }),
      {
        clipboardData: {
          files,
          types: ['Files'],
          getData: (type: string) => (type === 'text/plain' ? text : ''),
        },
      },
    );

  it('uploads a screenshot pasted into the description and sends it with the issue', async () => {
    const dialog = await openForm();
    paste(dialog, [screenshot()]);
    const list = await within(dialog).findByRole('list', {
      name: 'attachments.pending',
    });
    await waitFor(() =>
      expect(list.querySelector('img')?.getAttribute('src')).toBe(
        '/api/projects/attachments/f1/content',
      ),
    );
    expect(within(list).getByText(/^screenshot-.*\.png$/u)).toBeTruthy();
    expect(calls('POST', 'projects/attachments')).toHaveLength(1);

    fireEvent.click(within(dialog).getByText('common.create'));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({
      title: 'Broken login',
      attachmentIds: ['f1'],
    });
    await waitFor(() => expect(location()).toBe('/issues/i1'));
    // The files belong to the issue now: closing the form deletes none of them.
    expect(deleted()).toEqual([]);
  });

  it('keeps a paste that also carries text as text', async () => {
    const dialog = await openForm();
    paste(dialog, [screenshot()], 'A1\tB1');
    expect(calls('POST', 'projects/attachments')).toHaveLength(0);
    expect(
      within(dialog).queryByRole('list', { name: 'attachments.pending' }),
    ).toBeNull();
  });

  it('takes files dropped below the description, and chosen with the button', async () => {
    const dialog = await openForm();
    const choose = within(dialog).getByText('attachments.attach');
    fireEvent.drop(choose, {
      dataTransfer: { files: [screenshot()], types: ['Files'] },
    });
    fireEvent.change(within(dialog).getByTestId('pm-pending-files-input'), {
      target: { files: [new File(['log'], 'build.log')] },
    });
    await waitFor(() =>
      expect(calls('POST', 'projects/attachments')).toHaveLength(2),
    );
  });

  it('creates nothing while a file still uploads', async () => {
    const uploads = deferredUploads();
    const dialog = await openForm();
    paste(dialog, [screenshot()]);
    await within(dialog).findByLabelText(/^attachments\.uploading/u);
    expect(
      within(dialog)
        .getByText('common.create')
        .closest('button')
        ?.hasAttribute('disabled'),
    ).toBe(true);
    // Enter in the title submits the form without the button.
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement);
    expect(
      await within(dialog).findByText('issueForm.uploadsPending'),
    ).toBeTruthy();
    expect(created).toHaveLength(0);

    uploads.finish();
    await waitFor(() =>
      expect(
        within(dialog)
          .getByText('common.create')
          .closest('button')
          ?.hasAttribute('disabled'),
      ).toBe(false),
    );
    fireEvent.click(within(dialog).getByText('common.create'));
    await waitFor(() => expect(created).toHaveLength(1));
  });

  it('does not get past "Start now?" while a file added meanwhile uploads', async () => {
    api.routes['projects/me'] = () => ({ data: withAgents() });
    const uploads = deferredUploads();
    const dialog = await openForm();
    await waitFor(() =>
      expect(calls('GET', 'projects/executors')).toHaveLength(1),
    );
    await userEvent.click(within(dialog).getByLabelText('properties.executor'));
    await userEvent.click(
      await screen.findByRole('option', { name: /Coder/u }),
    );
    fireEvent.click(within(dialog).getByText('common.create'));
    expect(await screen.findByText('start.title')).toBeTruthy();
    paste(dialog, [screenshot()]);
    await waitFor(() =>
      expect(calls('POST', 'projects/attachments')).toHaveLength(1),
    );
    fireEvent.click(screen.getByText('start.start'));
    expect(
      await within(dialog).findByText('issueForm.uploadsPending'),
    ).toBeTruthy();
    expect(created).toHaveLength(0);
    uploads.finish();
  });

  it('counts files alone as unsaved, and deletes them when the form is discarded', async () => {
    renderNewIssue();
    const dialog = await screen.findByRole('dialog');
    paste(dialog, [screenshot()]);
    const list = await within(dialog).findByRole('list', {
      name: 'attachments.pending',
    });
    await waitFor(() => expect(list.querySelector('img')).not.toBeNull());

    fireEvent.click(within(dialog).getByText('actions.cancel'));
    fireEvent.click(await screen.findByText('unsavedChanges.discard'));
    await waitFor(() => expect(location()).not.toContain('/issues/new'));
    await waitFor(() => expect(deleted()).toEqual(['projects/attachments/f1']));
  });

  it('keeps the files after a failed create, for another try', async () => {
    let fail = true;
    api.routes['POST projects/issues'] = (request) => {
      if (fail) throw new FakeApiError(500);
      created.push(request.json);
      return { data: { id: 'i1', identifier: 'PM-1' } };
    };
    const dialog = await openForm();
    paste(dialog, [screenshot()]);
    const list = await within(dialog).findByRole('list', {
      name: 'attachments.pending',
    });
    await waitFor(() => expect(list.querySelector('img')).not.toBeNull());
    fireEvent.click(within(dialog).getByText('common.create'));
    expect(await within(dialog).findByRole('alert')).toBeTruthy();
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(deleted()).toEqual([]);

    fail = false;
    fireEvent.click(within(dialog).getByText('common.create'));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({ attachmentIds: ['f1'] });
  });

  it('takes a file back, deleting its upload', async () => {
    const dialog = await openForm();
    paste(dialog, [screenshot()]);
    const list = await within(dialog).findByRole('list', {
      name: 'attachments.pending',
    });
    await waitFor(() => expect(list.querySelector('img')).not.toBeNull());
    fireEvent.click(within(list).getByLabelText(/^attachments\.remove/u));
    await waitFor(() => expect(deleted()).toEqual(['projects/attachments/f1']));
    expect(
      within(dialog).queryByRole('list', { name: 'attachments.pending' }),
    ).toBeNull();
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
