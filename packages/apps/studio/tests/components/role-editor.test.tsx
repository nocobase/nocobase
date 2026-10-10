import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RoleEditor } from '../../client/pages/config/members/role-editor';
import type { RoleDraft } from '../../client/pages/config/members/roles-model';
import type { AccessCatalog } from '../../shared/access';

const ns = '@nocobase/app-plugin-projects';
const text = (key: string) => ({ key, ns });

/** A slice of what the plugins register (`GET /api/access/catalog`). */
const catalog: AccessCatalog = {
  businesses: [
    {
      type: 'pm',
      id: 'pm.projects',
      title: text('projects'),
      actions: [
        {
          key: 'pm.projects/view',
          name: 'view',
          title: text('projects.view'),
          levels: [
            { level: 'related', action: 'view.related' },
            { level: 'all', action: 'view.all' },
          ],
        },
      ],
    },
    {
      type: 'pm',
      id: 'pm.issues',
      title: text('issues'),
      actions: [
        {
          key: 'pm.issues/close',
          name: 'close',
          title: text('issues.close'),
          description: text('issues.close.description'),
          levels: [
            {
              level: 'related',
              action: 'close.related',
              label: 'Ones I own or in projects I lead',
              description: 'Issues I own, and issues in projects I lead',
            },
            { level: 'all', action: 'close.all' },
          ],
        },
        {
          key: 'pm.issues/delete',
          name: 'delete',
          title: text('issues.delete'),
          levels: [{ level: 'all', action: 'delete' }],
        },
      ],
    },
  ],
  settings: [
    {
      id: 'pm.labels',
      title: text('labels'),
      actions: [
        { key: 'pm.labels/read', name: 'read', title: text('read') },
        { key: 'pm.labels/update', name: 'update', title: text('update') },
      ],
    },
    {
      id: 'pm.members',
      title: text('members'),
      actions: [
        { key: 'pm.members/read', name: 'read', title: text('read') },
        { key: 'pm.members/invite', name: 'invite', title: text('invite') },
        {
          key: 'pm.members/define-roles',
          name: 'define-roles',
          title: text('defineRoles'),
        },
      ],
    },
  ],
};

const noAbilities = () => ({
  'pm.projects/view': 'none' as const,
  'pm.issues/close': 'none' as const,
  'pm.issues/delete': 'none' as const,
});

function draft(): RoleDraft {
  return {
    pages: new Set(['pm-issues'] as const),
    settings: {
      'pm.labels/read': true,
      'pm.labels/update': false,
      'pm.members/read': false,
      'pm.members/invite': false,
      'pm.members/define-roles': false,
    },
    abilities: { ...noAbilities(), 'pm.issues/close': 'related' },
  };
}

const section = (title: string): HTMLElement => {
  const region = screen
    .getByRole('button', { name: title })
    .closest('[data-slot="collapsible"]');
  expect(region).not.toBeNull();
  return region as HTMLElement;
};

const row = (name: string | RegExp): HTMLElement =>
  screen
    .getByRole('switch', { name })
    .closest('[data-slot="permission-row"]') as HTMLElement;

describe('the role editor', () => {
  it('shows business operations, pages and settings as three open sections', () => {
    render(
      <RoleEditor
        catalog={catalog}
        draft={draft()}
        readOnly={false}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      'roles.groups.business',
      'roles.groups.pages',
      'roles.groups.settings',
    ]);
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(
      screen.getByRole('switch', { name: 'navigation.issues' }),
    ).toBeChecked();
    expect(
      screen.getByRole('switch', { name: 'navigation.projects' }),
    ).not.toBeChecked();
  });

  it('lists the pages as the sidebar does, under its section titles', () => {
    render(
      <RoleEditor
        catalog={catalog}
        draft={draft()}
        readOnly={false}
        onChange={vi.fn()}
      />,
    );
    const pages = section('roles.groups.pages');
    expect(
      within(pages)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual([
      'navigation.development',
      'navigation.releases',
      'navigation.agentTeam',
    ]);
    expect(
      within(pages)
        .getAllByRole('switch')
        .map((item) => item.closest('div')?.textContent),
    ).toEqual([
      'navigation.myIssues',
      'navigation.dashboard',
      'navigation.issues',
      'navigation.projects',
      'navigation.knowledge',
      'navigation.releaseApps',
      'navigation.agents',
      'navigation.runtimes',
      'navigation.skills',
      'navigation.usage',
    ]);
  });

  it('turns a page on without touching the business operations', () => {
    const onChange = vi.fn();
    render(
      <RoleEditor
        catalog={catalog}
        draft={draft()}
        readOnly={false}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole('switch', { name: 'navigation.projects' }),
    );
    const next = onChange.mock.calls[0]?.[0] as RoleDraft;
    expect([...next.pages].sort()).toEqual(['pm-issues', 'pm-projects']);
    expect(next.abilities['pm.projects/view']).toBe('none');
  });

  it('shows a view-or-edit settings item as one switch with its level', () => {
    const onChange = vi.fn();
    render(
      <RoleEditor
        catalog={catalog}
        draft={draft()}
        readOnly={false}
        onChange={onChange}
      />,
    );
    // Without translations each title is its fallback: the item's id, the action's name.
    expect(
      within(row(/^pm\.labels/u)).getAllByText('read').length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('switch', { name: /^pm\.labels/u }));
    const next = onChange.mock.calls[0]?.[0] as RoleDraft;
    expect(next.settings['pm.labels/read']).toBe(false);
    expect(next.settings['pm.labels/update']).toBe(false);
  });

  it('gives each independent capability of an item its own switch', () => {
    const onChange = vi.fn();
    render(
      <RoleEditor
        catalog={catalog}
        draft={draft()}
        readOnly={false}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('switch', { name: 'define-roles' }));
    const next = onChange.mock.calls[0]?.[0] as RoleDraft;
    expect(next.settings['pm.members/define-roles']).toBe(true);
    expect(next.settings['pm.members/read']).toBe(false);
  });

  it('gives each business action a switch, and the level select only to one with related records', async () => {
    render(
      <RoleEditor
        catalog={catalog}
        draft={draft()}
        readOnly={false}
        onChange={vi.fn()}
      />,
    );
    const business = section('roles.groups.business');
    expect(within(business).getAllByRole('switch')).toHaveLength(3);
    // Off: no level to choose.
    expect(
      within(row(/^pm\.projects\/view/u)).queryByRole('combobox'),
    ).toBeNull();
    // A single level is the switch alone.
    expect(
      within(row(/^pm\.issues\/delete/u)).queryByRole('combobox'),
    ).toBeNull();
    const close = row(/^pm\.issues\/close/u);
    expect(within(close).getByRole('switch')).toBeChecked();
    expect(within(close).getByRole('combobox')).toHaveTextContent(
      'Ones I own or in projects I lead',
    );
    expect(close).toHaveTextContent(
      'Issues I own, and issues in projects I lead',
    );
    fireEvent.click(within(close).getByRole('combobox'));
    expect(
      (await screen.findAllByRole('option')).map(
        (option) => option.textContent,
      ),
    ).toEqual(['Ones I own or in projects I lead', 'roles.levels.all']);
  });

  it('switches a business action on at its lowest level and off to none', () => {
    const onChange = vi.fn();
    render(
      <RoleEditor
        catalog={catalog}
        draft={draft()}
        readOnly={false}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole('switch', { name: /^pm\.projects\/view/u }),
    );
    expect(
      (onChange.mock.calls[0]?.[0] as RoleDraft).abilities['pm.projects/view'],
    ).toBe('related');
    fireEvent.click(
      screen.getByRole('switch', { name: /^pm\.issues\/delete/u }),
    );
    expect(
      (onChange.mock.calls[1]?.[0] as RoleDraft).abilities['pm.issues/delete'],
    ).toBe('all');
    fireEvent.click(
      screen.getByRole('switch', { name: /^pm\.issues\/close/u }),
    );
    expect(
      (onChange.mock.calls[2]?.[0] as RoleDraft).abilities['pm.issues/close'],
    ).toBe('none');
  });

  it('is read-only when asked', () => {
    render(
      <RoleEditor
        catalog={catalog}
        draft={draft()}
        readOnly
        onChange={vi.fn()}
      />,
    );
    for (const item of screen.getAllByRole('switch'))
      expect(item).toHaveAttribute('aria-disabled', 'true');
  });
});
