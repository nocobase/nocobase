import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { defaultProjectDetailLabels } from '../../client/extensions/nocobase-project-detail/labels';
import { ProjectHeader } from '../../client/extensions/nocobase-project-detail/project-detail';
import {
  ProjectMembersEditor,
  ProjectResourceList,
  ResourceDialog,
  type ResourceFormValues,
} from '../../client/extensions/nocobase-project-detail/project-settings';

const labels = defaultProjectDetailLabels;

const directory = {
  id: 'r2',
  type: 'directory',
  runnerId: 'rn1',
  path: '/srv/data',
} as const;

const runners = {
  loading: false,
  options: [{ value: 'rn1', label: 'Studio Mac', description: 'online' }],
};

const requireUrl = (values: ResourceFormValues) =>
  values.type === 'gitRepo' && !values.url ? { url: 'Enter the URL.' } : {};

describe('ResourceDialog', () => {
  it('shows what validate answers, and asks a new directory for its runner by id without runners', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(
      <ResourceDialog
        resource='new'
        validate={(values) =>
          values.type === 'directory' && !values.path
            ? { path: 'Enter the path.' }
            : requireUrl(values)
        }
        onSubmit={onSubmit}
        onSaved={() => undefined}
        onRequestClose={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('Enter the URL.')).toBeTruthy();
    fireEvent.click(screen.getByText(labels.resources.directory));
    expect(screen.queryByLabelText(labels.resourceForm.url)).toBeNull();
    fireEvent.change(screen.getByLabelText(labels.resourceForm.runner), {
      target: { value: 'rn1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('Enter the path.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(labels.resourceForm.path), {
      target: { value: '/srv/data' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'directory',
          runnerId: 'rn1',
          path: '/srv/data',
        }),
      ),
    );
  });

  it('edits a directory with the runner picker, its type fixed, and shows a failed save above the fields', async () => {
    render(
      <ResourceDialog
        resource={directory}
        runners={runners}
        validate={() => ({})}
        onSubmit={() => Promise.reject(new Error('Not allowed.'))}
        onSaved={() => undefined}
        onRequestClose={() => undefined}
      >
        <p>variables of r2</p>
      </ResourceDialog>,
    );
    expect(
      screen.getByText(labels.resourceForm.editDirectoryTitle),
    ).toBeTruthy();
    expect(screen.queryByText(labels.resources.gitRepo)).toBeNull();
    expect(screen.getByText('Studio Mac')).toBeTruthy();
    expect(screen.getByText('variables of r2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Not allowed.');
  });
});

describe('ProjectResourceList', () => {
  const resources = [
    { id: 'r1', type: 'gitRepo', name: 'acme/app', detail: 'main' },
    { id: 'r2', type: 'directory', name: '/srv/data', detail: 'Studio Mac' },
  ] as const;

  it('marks the first primary and links each to its settings page, with no menu without callbacks', () => {
    render(
      <MemoryRouter>
        <ProjectResourceList
          resources={resources}
          hrefOf={(id) => `/projects/p1/settings/repos/${id}`}
        />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('listitem')[0]?.textContent).toContain(
      labels.resources.primary,
    );
    expect(
      screen.getByRole('link', { name: 'acme/app' }).getAttribute('href'),
    ).toBe('/projects/p1/settings/repos/r1');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('moves and removes from each row’s "…" menu, removing only once confirmed', async () => {
    const onMove = vi.fn();
    const onRemove = vi.fn();
    render(
      <MemoryRouter>
        <ProjectResourceList
          resources={resources}
          hrefOf={(id) => `/projects/p1/settings/repos/${id}`}
          onAdd={() => undefined}
          onMove={onMove}
          onRemove={onRemove}
        />
      </MemoryRouter>,
    );
    screen.getByRole('button', { name: 'Actions for acme/app' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(
      (
        await screen.findByRole('menuitem', { name: labels.resources.moveUp })
      ).getAttribute('aria-disabled'),
    ).toBe('true');
    expect(
      screen
        .getByRole('menuitem', { name: labels.resources.settings })
        .getAttribute('href'),
    ).toBe('/projects/p1/settings/repos/r1');
    await userEvent.click(
      screen.getByRole('menuitem', { name: labels.resources.moveDown }),
    );
    expect(onMove).toHaveBeenCalledWith(0, 1);
    screen.getByRole('button', { name: 'Actions for /srv/data' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(
      await screen.findByRole('menuitem', { name: labels.resources.remove }),
    );
    const confirm = await screen.findByRole('alertdialog');
    expect(confirm.textContent).toContain(
      'Remove the working directory “/srv/data”?',
    );
    expect(onRemove).not.toHaveBeenCalled();
    await userEvent.click(
      within(confirm).getByRole('button', { name: labels.resources.remove }),
    );
    expect(onRemove).toHaveBeenCalledWith('r2');
  });

  it('puts Add in the empty state while there is none', () => {
    const onAdd = vi.fn();
    render(
      <MemoryRouter>
        <ProjectResourceList resources={[]} onAdd={onAdd} />
      </MemoryRouter>,
    );
    expect(screen.getByText(labels.resources.empty)).toBeTruthy();
    const add = screen.getAllByRole('button', { name: labels.resources.add });
    expect(add).toHaveLength(1);
    fireEvent.click(add[0]!);
    expect(onAdd).toHaveBeenCalledOnce();
  });
});

describe('ProjectMembersEditor', () => {
  it('marks the lead, sets another lead and removes a member after confirming', async () => {
    const onAdd = vi.fn(() => Promise.resolve());
    const onSetLead = vi.fn(() => Promise.resolve());
    const onRemove = vi.fn(() => Promise.resolve());
    render(
      <ProjectMembersEditor
        visibility='members'
        members={[
          { id: 'u1', name: 'Ada', lead: true },
          { id: 'u2', name: 'Grace' },
        ]}
        candidates={[]}
        onAdd={onAdd}
        onSetLead={onSetLead}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText(labels.members.membersOnlyHint)).toBeTruthy();
    expect(screen.getByText('Ada').closest('li')?.textContent).toContain(
      labels.members.lead,
    );
    // The lead has no menu: there is no one to make lead, and removing them waits for another lead.
    expect(
      screen.queryByRole('button', { name: 'Actions for Ada' }),
    ).toBeNull();

    screen.getByRole('button', { name: 'Actions for Grace' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(
      await screen.findByRole('menuitem', { name: labels.members.setLead }),
    );
    expect(onSetLead).toHaveBeenCalledWith('u2');

    screen.getByRole('button', { name: 'Actions for Grace' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(
      await screen.findByRole('menuitem', {
        name: labels.members.removeAction,
      }),
    );
    expect(onRemove).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('Remove Grace?');
    await userEvent.click(
      within(dialog).getByRole('button', {
        name: labels.members.removeAction,
      }),
    );
    expect(onRemove).toHaveBeenCalledWith('u2');
  });

  it('searches only people who are not members yet and adds the one picked', async () => {
    const onAdd = vi.fn(() => Promise.resolve());
    render(
      <ProjectMembersEditor
        visibility='everyone'
        members={[{ id: 'u1', name: 'Ada', lead: true }]}
        // A stale candidate list may still name a member; the search leaves them out.
        candidates={[
          { value: 'u1', label: 'Ada' },
          { value: 'u2', label: 'Grace' },
        ]}
        onAdd={onAdd}
      />,
    );
    const search = screen.getByRole('combobox', {
      name: labels.members.choose,
    });
    await userEvent.type(search, 'a');
    expect(await screen.findByRole('option', { name: 'Grace' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Ada' })).toBeNull();
    await userEvent.click(screen.getByRole('option', { name: 'Grace' }));
    expect(onAdd).toHaveBeenCalledWith('u2');
  });
});

describe('ProjectHeader', () => {
  it('names the workflow, the lead and the progress, with a lock for a members-only project', () => {
    render(
      <ProjectHeader
        name='Apollo'
        status={{ name: 'In progress', color: 'blue' }}
        membersOnly
        progress={{ percent: 50, label: '1 of 2 issues done' }}
        lead={{ name: 'Ada' }}
        workflow='Release train'
      />,
    );
    const header = screen.getByRole('banner');
    expect(header.textContent).toContain('Release train');
    expect(header.textContent).toContain('Ada');
    expect(screen.getByLabelText(labels.header.private)).toBeTruthy();
    expect(
      screen.getByRole('img', { name: '1 of 2 issues done' }),
    ).toBeTruthy();
  });
});
