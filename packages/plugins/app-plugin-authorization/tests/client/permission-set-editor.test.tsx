// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { PermissionSetEditor } from '../../client/pages/permission-sets/editor.js';
import {
  pageSubsection,
  sections,
  subsection,
  withSubsections,
} from '../helpers/workspace-options.js';
import { useRef, useState } from 'react';
import type { AuthorizationOptions } from '../../client/authorization-client.js';
import type {
  Draft,
  GrantDraft,
} from '../../client/pages/permission-sets/types.js';
import { BulkPermissionToggle } from '../../client/pages/permission-sets/bulk-permissions.js';
import { ModulePermissions } from '../../client/pages/permission-sets/module-permissions.js';
import { resourceRows } from '../../client/pages/permission-sets/resource-groups.js';
import {
  empty,
  fromSet,
  toInput,
} from '../../client/pages/permission-sets/drafts.js';
import { ScopedOperation } from '../../client/pages/permission-sets/scoped-operation.js';

import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import { createAuthorizationI18n, i18nWrapper } from '../helpers/i18n.js';

// The editor renders under this plugin's routes.
const wrapper = i18nWrapper(
  await createAuthorizationI18n(),
  AUTHORIZATION_NAMESPACE,
);

describe('the permission set editor workspace', () => {
  const read = { value: 'read', label: 'Read' };
  const view = { value: 'view', label: 'View' };
  const options: AuthorizationOptions = {
    sections: withSubsections({
      administration: [
        subsection(
          'administration.authorization',
          'Authorization',
          [
            {
              type: 'settings',
              value: 'authorization.permission-sets',
              label: 'Permission sets',
              actions: [read],
            },
          ],
          { groups: [] },
        ),
      ],
    }),
    subjectTypes: [],
    recordAccess: [],
    collections: [],
  };

  const workspace: AuthorizationOptions = {
    ...options,
    sections: withSubsections({
      pages: [pageSubsection([{ value: 'orders', label: 'Orders' }])],
      business: [
        subsection('example.sales', 'Sales', [
          {
            type: 'composite',
            value: 'orders',
            label: 'Orders',
            actions: [view],
          },
        ]),
        subsection('example.delivery', 'Delivery', [
          {
            type: 'composite',
            value: 'shipments',
            label: 'Shipments',
            actions: [view],
          },
        ]),
      ],
      administration: options.sections[2].subsections,
    }),
  };

  function Location() {
    return <output data-testid='location'>{useLocation().search}</output>;
  }

  function Harness({
    resourceOptions = options,
    grants = [],
    url = '/',
    onChange,
  }: {
    resourceOptions?: AuthorizationOptions;
    grants?: Draft['grants'];
    url?: string;
    onChange?: (draft: Draft) => void;
  }) {
    const [draft, setDraft] = useState<Draft>({
      originalKey: 'staff',
      key: 'staff',
      title: 'Staff',
      grants,
    });
    return (
      <MemoryRouter initialEntries={[url]}>
        <PermissionSetEditor
          dirty={true}
          options={resourceOptions}
          draft={draft}
          busy={false}
          onChange={(next) => {
            onChange?.(next);
            setDraft(next);
          }}
          onClose={() => {}}
          onSave={(event) => {
            event.preventDefault();
            return Promise.resolve();
          }}
        />
        <Location />
      </MemoryRouter>
    );
  }

  function sidebar(): string[] {
    return [
      ...screen.getByRole('navigation', { name: 'Resource types' }).children,
    ].map((element) => element.textContent ?? '');
  }

  describe('scope controls', () => {
    it('toggles simple permissions directly with no menu', () => {
      render(<Harness />, { wrapper });
      const button = screen.getByRole('button', {
        name: 'Permission sets: Read',
      });
      expect(button).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('lists section headers, then one entry per subsection, without resource types', () => {
    render(<Harness resourceOptions={workspace} />, { wrapper });
    expect(sidebar()).toEqual([
      'Page permissions',
      'Pages',
      'Business permissions',
      'Sales',
      'Delivery',
      'Administration',
      'Authorization',
    ]);
    expect(screen.queryByText('Business features')).not.toBeInTheDocument();
  });

  it('marks each subsection holding a grant as configured', () => {
    render(
      <Harness
        resourceOptions={workspace}
        grants={[
          {
            id: 1,
            resource: { type: 'composite', id: 'shipments' },
            actions: ['view'],
          },
          { id: 2, resource: { type: 'page', id: '*' }, actions: ['access'] },
        ]}
      />,
      { wrapper },
    );
    const shield = (name: string) =>
      within(screen.getByRole('button', { name, exact: true })).queryByRole(
        'img',
        { name: 'Configured in this set' },
      );
    expect(shield('Pages')).not.toBeNull();
    expect(shield('Delivery')).not.toBeNull();
    expect(shield('Sales')).toBeNull();
    expect(shield('Authorization')).toBeNull();
  });

  it('edits page entry independently from a business resource with the same ID', () => {
    let current: Draft | undefined;
    render(
      <Harness
        resourceOptions={workspace}
        grants={[
          {
            id: 1,
            resource: { type: 'composite', id: 'orders' },
            actions: ['view'],
          },
        ]}
        onChange={(next) => {
          current = next;
        }}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: 'Pages', exact: true }),
    ).toHaveAttribute('aria-current', 'true');
    expect(
      screen
        .getAllByRole('group', { name: 'Orders' })[0]
        .querySelectorAll('button'),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Sales', exact: true }));
    expect(
      screen.getByRole('button', { name: 'Orders: View' }),
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Pages', exact: true }));
    const access = screen.getByRole('button', { name: 'Orders: Access' });
    expect(access).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(access);
    expect(
      current?.grants.find((grant) => grant.resource.type === 'page')?.actions,
    ).toEqual(['access']);
    expect(
      current?.grants.find((grant) => grant.resource.type === 'composite')
        ?.actions,
    ).toEqual(['view']);
    fireEvent.click(access);
    expect(
      current?.grants.find((grant) => grant.resource.type === 'page'),
    ).toBeUndefined();
    expect(
      current?.grants.find((grant) => grant.resource.type === 'composite')
        ?.actions,
    ).toEqual(['view']);
  });

  it('keeps empty page and business sections discoverable with development guidance, apart from empty search results', () => {
    render(
      <Harness
        resourceOptions={{
          ...options,
          sections: withSubsections({
            pages: [pageSubsection()],
            administration: options.sections[2].subsections,
          }),
        }}
      />,
      { wrapper },
    );
    expect(sidebar()).toEqual([
      'Page permissions',
      'Page permissions',
      'Business permissions',
      'Business permissions',
      'Administration',
      'Authorization',
    ]);
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Page permissions' })[0],
    );
    expect(screen.getByText(/No pages requiring authorization/)).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'Business permissions' }),
    );
    expect(
      screen.getByText(/No business permissions have been defined/),
    ).toBeVisible();
    expect(screen.queryByText(/Try telling AI:/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Configured in this set' }),
    ).not.toBeInTheDocument();
    cleanup();

    render(<Harness resourceOptions={{ ...options, sections }} />, { wrapper });
    expect(screen.getByText(/No pages requiring authorization/)).toBeVisible();
    cleanup();

    render(<Harness />, { wrapper });
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Search resources' }),
      {
        target: { value: 'missing' },
      },
    );
    expect(
      screen.queryByText(/No business permissions have been defined/),
    ).not.toBeInTheDocument();
  });
});

describe('resource search', () => {
  it('finds resources by translated label, original label and identifier', () => {
    const options: AuthorizationOptions = {
      sections: withSubsections({
        pages: [
          pageSubsection([
            { value: 'home-id', label: '首页', searchText: 'Home' },
          ]),
        ],
      }),
      subjectTypes: [],
      collections: [],
      recordAccess: [],
    };
    render(
      <MemoryRouter>
        <PermissionSetEditor
          dirty={true}
          options={options}
          draft={{
            originalKey: 'test',
            key: 'test',
            title: 'Test',
            grants: [],
          }}
          busy={false}
          onChange={() => {}}
          onSave={() => {}}
          onClose={() => {}}
        />
      </MemoryRouter>,
      { wrapper },
    );
    const search = screen.getByRole('textbox', { name: 'Search resources' });
    for (const query of ['首页', 'Home', 'home-id']) {
      fireEvent.change(search, { target: { value: query } });
      expect(screen.getByRole('group', { name: '首页' })).toBeVisible();
    }
    fireEvent.change(search, { target: { value: 'reports' } });
    expect(
      screen.queryByRole('group', { name: '首页' }),
    ).not.toBeInTheDocument();
  });
});

describe('bulk simple permissions', () => {
  const options: AuthorizationOptions = {
    sections: withSubsections({
      pages: [
        pageSubsection(
          [
            { value: 'orders', label: 'Orders', group: 'sales' },
            { value: 'reports', label: 'Reports', group: 'business' },
            { value: 'home', label: 'Home' },
            { value: 'blocked', label: 'Blocked', actions: [] },
          ],
          [
            {
              value: 'business',
              label: 'Business',
              children: [{ value: 'sales', label: 'Sales' }],
            },
          ],
        ),
      ],
    }),
    collections: [],
    recordAccess: [],
    subjectTypes: [],
  };
  function Harness() {
    const [draft, setDraft] = useState<Draft>({
      originalKey: 'staff',
      key: 'staff',
      title: 'Staff',
      grants: [
        {
          id: 1,
          resource: { type: 'settings', id: 'existing' },
          actions: ['read'],
        },
      ],
    });
    return (
      <MemoryRouter>
        <output data-testid='draft'>{JSON.stringify(draft.grants)}</output>
        <PermissionSetEditor
          dirty={true}
          options={options}
          draft={draft}
          busy={false}
          onChange={setDraft}
          onClose={() => {}}
          onSave={async (event) => {
            event.preventDefault();
          }}
        />
      </MemoryRouter>
    );
  }
  describe('bulk simple permissions', () => {
    it('includes collapsed descendants and marks partial selections', () => {
      render(<Harness />, { wrapper });
      fireEvent.click(
        screen.getByRole('button', { name: 'Sales', exact: true }),
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Access: Select all in Business' }),
      );
      expect(
        screen.getByRole('button', { name: 'Access: Select all in Business' }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByRole('button', { name: 'Access: Select all', exact: true }),
      ).toHaveAttribute('aria-pressed', 'mixed');
      expect(screen.getByTestId('draft')).toHaveTextContent('orders');
      expect(screen.getByTestId('draft')).toHaveTextContent('reports');
      expect(screen.getByTestId('draft')).toHaveTextContent('existing');
      expect(screen.getByTestId('draft')).not.toHaveTextContent('blocked');
      fireEvent.click(
        screen.getByRole('button', { name: 'Access: Select all in Business' }),
      );
      expect(screen.getByTestId('draft')).not.toHaveTextContent('orders');
      expect(screen.getByTestId('draft')).toHaveTextContent('existing');
    });
    it('selects all eligible resources and limits filtered selection to matches', () => {
      render(<Harness />, { wrapper });
      fireEvent.click(
        screen.getByRole('button', { name: 'Access: Select all', exact: true }),
      );
      expect(
        screen.getByRole('button', { name: 'Access: Select all', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('draft')).toHaveTextContent('home');
      expect(screen.getByTestId('draft')).not.toHaveTextContent('blocked');
      fireEvent.change(
        screen.getByRole('textbox', { name: 'Search resources' }),
        { target: { value: 'Orders' } },
      );
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Access: Select matching resources',
        }),
      );
      expect(screen.getByTestId('draft')).not.toHaveTextContent('orders');
      expect(screen.getByTestId('draft')).toHaveTextContent('reports');
      expect(screen.getByTestId('draft')).toHaveTextContent('home');
    });
  });
});

describe('module permissions', () => {
  const read = { value: 'read', label: 'Read' };
  const test = { value: 'test', label: 'Send test email' };
  const items = [
    {
      type: 'settings',
      value: 'email',
      label: 'Email',
      group: 'system',
      actions: [read, test],
    },
    {
      type: 'settings',
      value: 'audit',
      label: 'Audit',
      group: 'system',
      actions: [read],
    },
  ];
  function Harness({ pages = false }: { pages?: boolean }) {
    const [draft, setDraft] = useState(empty);
    const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
      () => new Set(),
    );
    return (
      <>
        <ModulePermissions
          pages={pages}
          label='Settings'
          items={items}
          actions={[read, test]}
          rows={resourceRows(
            [{ value: 'system', label: 'System' }],
            items,
            collapsed,
          )}
          collapsed={collapsed}
          onCollapse={(id) =>
            setCollapsed(new Set(collapsed.has(id) ? [] : [id]))
          }
          draft={draft}
          disabled={false}
          filtered={false}
          onChange={setDraft}
          onToggle={(grant, action, mode) =>
            setDraft({
              ...draft,
              grants: [{ ...grant, actions: mode === 'all' ? [action] : [] }],
            })
          }
        />
        <output data-testid='grants'>
          {JSON.stringify(
            draft.grants.map(({ resource, actions }) => ({
              id: resource.id,
              actions,
            })),
          )}
        </output>
      </>
    );
  }
  it('renders module-specific actions and bulk-selects only supported actions even inside collapsed groups', () => {
    render(<Harness />, { wrapper });
    expect(
      screen.queryByRole('button', { name: 'Audit: Send test email' }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Email: Send test email' }),
    );
    expect(
      screen.getByRole('button', { name: 'Email: Send test email' }),
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(
      screen.getByRole('button', { name: 'System', exact: true }),
    );
    expect(
      screen.queryByRole('button', { name: 'Email: Read' }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Select all', exact: true }),
    );
    expect(JSON.parse(screen.getByTestId('grants').textContent!)).toEqual([
      { id: 'email', actions: ['test', 'read'] },
      { id: 'audit', actions: ['read'] },
    ]);
  });

  it('keeps an all-selected bulk indicator limited when an operation has a restricted scope', () => {
    render(
      <BulkPermissionToggle
        items={[
          {
            type: 'composite',
            value: 'orders',
            label: 'Orders',
            actions: [read],
            dataScopes: {
              read: [
                {
                  key: 'orders',
                  label: 'Orders',
                  collection: 'orders',
                  collectionFields: [],
                  defaultValue: '',
                  options: [],
                },
              ],
            },
          },
        ]}
        actions={[read]}
        draft={{
          ...empty(),
          grants: [
            {
              id: 1,
              resource: { type: 'composite', id: 'orders' },
              actions: ['read'],
              policies: {
                read: { type: 'composite', scopes: { orders: 'recordsIOwn' } },
              },
            },
          ],
        }}
        disabled={false}
        label='Select all'
        onChange={() => {}}
      />,
      { wrapper },
    );
    expect(screen.getByRole('button', { name: 'Select all' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('img', { name: 'Limited access' }),
    ).toBeInTheDocument();
  });
});

describe('scoped operations', () => {
  function Harness({ defaults = false }: { defaults?: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [grant, setGrant] = useState<GrantDraft>({
      id: 1,
      resource: { type: 'composite', id: 'quotes' },
      actions: ['submit'],
      policies: {
        submit: {
          type: 'composite',
          scopes: {
            quotes: {
              type: 'recordAccess',
              key: 'customFilter',
              params: { filter: { kind: 'group', logic: 'and', items: [] } },
            },
          },
        },
      },
    });
    return (
      <div ref={containerRef}>
        <ScopedOperation
          container={containerRef}
          item={{ value: 'quotes', label: 'Quotes' }}
          action={{ value: 'submit', label: 'Submit' }}
          config={['projects', 'quotes'].map((key) => ({
            key,
            label: key,
            collection: key,
            collectionFields: [],
            defaultValue: defaults ? 'recordsIOwn' : '',
            options: [
              { value: '', label: 'Defaults' },
              { value: 'allRecords', label: 'All records' },
              { value: 'recordsIOwn', label: 'Own records' },
              { value: 'customFilter', label: 'Custom filter' },
            ],
          }))}
          grant={grant}
          disabled={false}
          onToggle={() => {}}
          onChange={setGrant}
        />
        <output data-testid='grant'>{JSON.stringify(grant)}</output>
      </div>
    );
  }
  it('toggles each scope independently, preserves sibling configuration and retains the operation grant', () => {
    render(<Harness />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Quotes: Submit' }));
    expect(
      screen.getByRole('checkbox', { name: 'Specify scope: projects' }),
    ).not.toBeChecked();
    expect(
      screen.queryByRole('combobox', { name: 'projects' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Specify scope: quotes' }),
    ).toBeChecked();
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Specify scope: projects' }),
    );
    expect(
      screen.getByRole('combobox', { name: 'projects' }),
    ).toBeInTheDocument();
    const enabled = JSON.parse(
      screen.getByTestId('grant').textContent!,
    ) as GrantDraft;
    expect(enabled.policies?.submit).toMatchObject({
      scopes: { projects: 'recordsIOwn', quotes: { key: 'customFilter' } },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Specify scope: projects' }),
    );
    const disabled = JSON.parse(
      screen.getByTestId('grant').textContent!,
    ) as GrantDraft;
    expect(disabled.actions).toEqual(['submit']);
    expect(disabled.policies?.submit).toMatchObject({
      scopes: { projects: '', quotes: { key: 'customFilter' } },
    });
    expect(
      screen.queryByRole('combobox', { name: 'projects' }),
    ).not.toBeInTheDocument();
  });
  it('explicitly disables a registered default instead of silently restoring it on save', () => {
    render(<Harness defaults />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Quotes: Submit' }));
    expect(
      screen.getByRole('checkbox', { name: 'Specify scope: projects' }),
    ).toBeChecked();
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Specify scope: projects' }),
    );
    expect(
      JSON.parse(screen.getByTestId('grant').textContent!).policies.submit
        .scopes.projects,
    ).toBe('');
  });
});

describe('composite scopes in the configuration drawer', () => {
  const original = {
    key: 'dispatcher',
    title: 'Dispatcher',
    grants: [
      {
        resource: { type: 'composite', id: 'tasks' },
        actions: [
          {
            action: 'assign',
            policy: {
              type: 'composite',
              scopes: { tasks: 'own', people: 'department' },
              futureConstraint: { keep: true },
            },
          },
        ],
      },
    ],
  };
  function Harness() {
    const [draft, setDraft] = useState(() => fromSet(original));
    const containerRef = useRef<HTMLDivElement>(null);
    return (
      <div ref={containerRef}>
        <ScopedOperation
          container={containerRef}
          item={{ value: 'tasks', label: 'Tasks' }}
          action={{ value: 'assign', label: 'Assign' }}
          config={[
            {
              key: 'tasks',
              label: 'Task scope',
              collection: 'tasks',
              collectionFields: [],
              defaultValue: 'own',
              options: [
                { value: 'own', label: 'Own tasks' },
                { value: 'all', label: 'All tasks' },
              ],
            },
            {
              key: 'people',
              label: 'Eligible assignees',
              collection: 'users',
              collectionFields: [],
              defaultValue: 'department',
              options: [{ value: 'department', label: 'Department members' }],
            },
          ]}
          grant={draft.grants[0]}
          disabled={false}
          onToggle={() => {}}
          onChange={(grant) => setDraft({ ...draft, grants: [grant] })}
        />
        <output data-testid='policy'>
          {JSON.stringify(toInput(draft).grants[0].actions[0].policy)}
        </output>
      </div>
    );
  }
  it('edits named business scopes in the configuration drawer without discarding the other scope', async () => {
    render(<Harness />, { wrapper });
    expect(
      screen.getByRole('img', { name: 'Limited access' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tasks: Assign' }));
    expect(screen.getByText(/Eligible assignees/)).toBeVisible();
    expect(
      screen.getByRole('radio', { name: 'Configure permission' }),
    ).toBeChecked();
    expect(screen.getByRole('radio', { name: 'No access' })).not.toBeChecked();
    fireEvent.click(screen.getAllByRole('combobox')[0]);
    const option = await screen.findByRole('option', { name: 'All tasks' });
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.mouseUp(option);
    fireEvent.click(option);
    expect(JSON.parse(screen.getByTestId('policy').textContent!)).toEqual({
      type: 'composite',
      scopes: { tasks: 'all', people: 'department' },
      futureConstraint: { keep: true },
    });
  });
});
