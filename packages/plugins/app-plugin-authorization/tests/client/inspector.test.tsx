import { selectOption } from '../helpers/select-option.js';
// @vitest-environment jsdom
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import type {
  AuthorizationInspection,
  AuthorizationOptions,
} from '../../client/authorization-client.js';
const mocks = vi.hoisted(() => ({
  routes: [] as AppClientRegisteredRoute[],
  loadOptions: vi.fn(),
  listSubjects: vi.fn(),
  resolveSubjects: vi.fn(),
  inspectBatch: vi.fn(),
  inspectConfigured: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useClientApplication: () => ({ runtime: { routes: mocks.routes } }),
}));
vi.mock('../../client/use-authorization-client.js', () => ({
  useAuthorizationClient: () => mocks,
}));
import { InspectionConditions } from '../../client/pages/inspector-conditions.js';
import InspectorPage from '../../client/pages/inspector-page.js';
import { inspectionStatus } from '../../client/pages/inspector-status.js';
import en from '../../client/locales/en-US.js';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import { createAuthorizationI18n, i18nWrapper } from '../helpers/i18n.js';
import {
  pageSubsection,
  subsection,
  wire,
  withSubsections,
} from '../helpers/workspace-options.js';
// The inspector renders under this plugin's routes.
const wrapper = i18nWrapper(
  await createAuthorizationI18n(),
  AUTHORIZATION_NAMESPACE,
);
// Reason codes other plugins report, and page titles from other packages' routes, are not keys any namespace owns: they
// are translated with the server message or the title itself as `defaultValue`.
const lenient = i18nWrapper(
  await createAuthorizationI18n({ strict: false }),
  AUTHORIZATION_NAMESPACE,
);
const read = { value: 'read', label: 'Read' };
const view = { value: 'view', label: 'View' };
const tables = subsection(
  'example.data',
  'Data tables',
  Array.from({ length: 25 }, (_, i) => ({
    type: 'database.collection',
    value: `orders${i}`,
    label: `Orders ${i}`,
    group: 'sales',
  })),
  {
    groups: [{ value: 'sales', label: 'Sales' }],
    actions: [read, { value: 'update', label: 'Update' }],
  },
);
const options: AuthorizationOptions = {
  sections: withSubsections({ business: [tables] }),
  subjectTypes: [
    { value: 'user', label: 'Users', selection: { type: 'collection' } },
    {
      value: 'department',
      label: 'Departments',
      selection: { type: 'collection' },
    },
    {
      value: 'authenticated',
      label: 'All signed-in users',
      selection: { type: 'fixed', id: '*' },
    },
  ],
  recordAccess: [],
  collections: [{ name: 'orders0', fields: ['id', 'title'] }],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.routes = [];
  mocks.loadOptions.mockResolvedValue(wire(options));
  mocks.inspectConfigured.mockResolvedValue({
    unrestricted: false,
    types: ['database.collection'],
    resources: [{ type: 'database.collection', id: 'orders24' }],
  });
  mocks.listSubjects.mockResolvedValue({
    items: [{ id: 'alice', title: 'Alice' }],
    total: 1,
  });
  mocks.resolveSubjects.mockResolvedValue([{ id: 'alice', title: 'Alice' }]);
  mocks.inspectBatch.mockImplementation(
    (_subject: unknown, checks: Omit<AuthorizationInspection, 'decision'>[]) =>
      Promise.resolve(
        checks.map((check) => ({
          ...check,
          decision: {
            effect: 'conditional',
            conditions: {
              type: 'database',
              scope: true,
              fields: ['id', 'title'],
            },
            reasons: [
              { code: 'GRANT_MATCHED', message: 'Sales team grants access' },
            ],
          },
        })),
      ),
  );
});
function mount(url = '/?user=alice', i18n = wrapper) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <InspectorPage />
    </MemoryRouter>,
    { wrapper: i18n },
  );
}
it('waits for a person before computing access', async () => {
  mount('/');
  expect(await screen.findByText(en.inspector.empty)).toBeInTheDocument();
  expect(mocks.inspectBatch).not.toHaveBeenCalled();
});
it('batches only the current page, supports group collapse and shows readable scope details', async () => {
  mount();
  // The first full render of the page is slow on a cold CI runner.
  const cell = await screen.findByRole(
    'button',
    { name: 'Orders 0: Read' },
    { timeout: 5000 },
  );
  expect(mocks.inspectBatch.mock.calls[0]?.[1]).toHaveLength(40);
  expect(screen.queryByText('Orders 20')).not.toBeInTheDocument();
  fireEvent.click(cell);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(
    screen.getByText(en.inspector.reasonCodes.GRANT_MATCHED),
  ).toBeInTheDocument();
  expect(screen.getByText(en.labels.allRecords)).toBeInTheDocument();
  expect(
    screen.getByRole('textbox', { name: en.inspector.fieldSearch }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: en.common.close }));
  fireEvent.click(screen.getByRole('button', { name: 'Sales' }));
  expect(screen.queryByText('Orders 0')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Sales' }));
  const next = screen.getAllByRole('button', { name: en.subjects.next });
  fireEvent.click(next[next.length - 1]!);
  await screen.findByRole('button', { name: 'Orders 20: Read' });
  expect(mocks.inspectBatch.mock.calls[1]?.[1]).toHaveLength(10);
});
it.each([
  [
    'a failed calculation',
    {
      effect: 'deny',
      reasons: [{ code: 'AUTHORIZATION_HANDLER_FAILED', message: 'failed' }],
    },
    undefined,
    'error',
  ],
  ['a denial', { effect: 'deny', reasons: [] }, undefined, 'none'],
  [
    'a user-dependent subject scope',
    {
      effect: 'deny',
      reasons: [
        { code: 'USER_CONTEXT_REQUIRED', message: 'User context required' },
      ],
    },
    undefined,
    'context',
  ],
  [
    'every field in scope',
    {
      effect: 'conditional',
      reasons: [],
      conditions: { type: 'database', scope: true, fields: ['id'] },
    },
    ['id'],
    'all',
  ],
  [
    'some fields in scope',
    {
      effect: 'conditional',
      reasons: [],
      conditions: { type: 'database', scope: true, fields: ['id'] },
    },
    ['id', 'title'],
    'scoped',
  ],
] as const)('shows %s as its own status', (_name, decision, fields, status) => {
  expect(inspectionStatus(decision, fields)).toBe(status);
});
it('ignores stale responses after changing resource search', async () => {
  let resolve!: (result: readonly AuthorizationInspection[]) => void;
  mocks.inspectBatch.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  mount();
  const search = await screen.findByRole('textbox', {
    name: en.permissionSets.picker.searchResources,
  });
  await waitFor(() => expect(mocks.inspectBatch).toHaveBeenCalledOnce());
  fireEvent.change(search, { target: { value: 'Orders 24' } });
  await screen.findByRole('button', { name: 'Orders 24: Read' });
  resolve([]);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Orders 24: Read' }),
    ).toBeInTheDocument(),
  );
});

it('clamps stale page numbers and resets search when switching subsections', async () => {
  mocks.loadOptions.mockResolvedValue(
    wire({
      ...options,
      sections: withSubsections({
        business: [tables],
        administration: [
          subsection('administration.other', 'Settings', [
            {
              type: 'settings',
              value: 'authorization',
              label: 'Authorization',
              actions: [read],
            },
          ]),
        ],
      }),
    }),
  );
  mount('/?user=alice&page=999&search=Orders');
  expect(
    await screen.findByRole('button', { name: 'Orders 24: Read' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  expect(
    await screen.findByRole('button', { name: 'Authorization: Read' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('textbox', {
      name: en.permissionSets.picker.searchResources,
    }),
  ).toHaveValue('');
});

it('selects a registered department and a fixed subject without treating either as a user', async () => {
  mocks.listSubjects.mockImplementation((_settings: string, type: string) =>
    Promise.resolve({
      items: [
        {
          id: 'sales',
          title: type === 'department' ? 'Sales department' : 'Alice',
        },
      ],
      total: 1,
    }),
  );
  mocks.resolveSubjects.mockResolvedValue([
    { id: 'sales', title: 'Sales department' },
  ]);
  mount('/');
  await selectOption(
    await screen.findByRole('combobox', { name: en.inspector.subjectType }),
    'Departments',
  );
  await waitFor(() =>
    expect(mocks.listSubjects).toHaveBeenCalledWith(
      'inspector',
      'department',
      expect.objectContaining({ page: 1 }),
    ),
  );
  await selectOption(
    screen.getByRole('combobox', { name: en.inspector.subject }),
    'Sales department',
  );
  await waitFor(() =>
    expect(mocks.inspectBatch).toHaveBeenCalledWith(
      { type: 'department', id: 'sales' },
      expect.any(Array),
    ),
  );
  await selectOption(
    screen.getByRole('combobox', { name: en.inspector.subjectType }),
    'All signed-in users',
  );
  await waitFor(() =>
    expect(mocks.inspectBatch).toHaveBeenLastCalledWith(
      { type: 'authenticated', id: '*' },
      expect.any(Array),
    ),
  );
  expect(
    screen.queryByRole('combobox', { name: en.inspector.subject }),
  ).not.toBeInTheDocument();
});

it.each([
  { unrestricted: false, ids: ['sales.quotes'], marked: ['Sales'] },
  { unrestricted: false, ids: ['*'], marked: ['Sales', 'Delivery'] },
])(
  'marks only configured subsections, without counts: %j',
  async ({ unrestricted, ids, marked }) => {
    mocks.loadOptions.mockResolvedValue(
      wire({
        ...options,
        sections: withSubsections({
          business: [
            subsection('example.sales', 'Sales', [
              {
                type: 'composite',
                value: 'sales.quotes',
                label: 'Quotes',
                actions: [view],
              },
            ]),
            subsection('example.delivery', 'Delivery', [
              {
                type: 'composite',
                value: 'delivery.orders',
                label: 'Orders',
                actions: [view],
              },
            ]),
          ],
        }),
      }),
    );
    mocks.inspectConfigured.mockResolvedValue({
      unrestricted,
      types: ['business', 'page'],
      resources: [
        ...ids.map((id) => ({ type: 'composite', id })),
        // The same ID under another resource type must not mark the subsection.
        { type: 'page', id: 'delivery.orders' },
      ],
    });
    mount();
    await screen.findByRole('button', { name: 'Quotes: View' });
    await waitFor(() =>
      expect(
        ['Sales', 'Delivery'].filter((label) =>
          within(screen.getByRole('button', { name: label })).queryByRole(
            'img',
          ),
        ),
      ).toEqual(marked),
    );
    // A mark, not a count.
    for (const label of ['Sales', 'Delivery'])
      expect(screen.getByRole('button', { name: label })).not.toHaveTextContent(
        /\d/,
      );
  },
);

it('filters configured resources before pagination and preserves action columns', async () => {
  mount('/?user=alice&page=2');
  await screen.findByRole('button', { name: 'Orders 24: Read' });
  fireEvent.click(
    screen.getByRole('checkbox', {
      name: en.permissionWorkspace.configuredOnly,
    }),
  );
  await waitFor(() => expect(screen.getByText('1 / 1')).toBeVisible());
  expect(screen.getByText('Orders 24')).toBeVisible();
  expect(screen.queryByText('Orders 20')).toBeNull();
  expect(screen.queryByRole('columnheader', { name: 'Read' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Orders 24: Read' })).toBeVisible();
  fireEvent.change(
    screen.getByRole('textbox', {
      name: en.permissionSets.picker.searchResources,
    }),
    { target: { value: 'missing' } },
  );
  expect(await screen.findByText(en.inspector.noResources)).toBeVisible();
});

it('keeps all resources for an unrestricted identity when filtering to configured ones', async () => {
  mocks.inspectConfigured.mockResolvedValue({
    unrestricted: true,
    types: [],
    resources: [],
  });
  mount('/?user=alice&configuredOnly=true');
  expect(
    await screen.findByRole('button', { name: 'Orders 0: Read' }),
  ).toBeVisible();
  expect(screen.getByText('1 / 2')).toBeVisible();
});

it('explains business access once and keeps page checks and JSON in one collapsed technical section', async () => {
  const grant = {
    code: 'GRANT_MATCHED',
    message: 'raw grant',
    plugin: 'resource',
    details: {
      source: {
        plugin: 'permission-sets',
        id: 'sales-assistant',
        title: 'Sales assistant',
      },
    },
  };
  const database = {
    effect: 'conditional' as const,
    conditions: {
      type: 'database',
      action: 'read',
      scope: true,
      fields: ['id'],
    },
    reasons: [
      grant,
      {
        code: 'SELECTION_EXPANDED',
        message: 'raw scope',
        details: {
          source: { plugin: 'default-access', id: 'quotes-default' },
          selection: { type: 'recordAccess', key: 'own' },
        },
      },
      {
        code: 'SELECTION_RESTRICTED',
        message: 'raw restriction',
        details: {
          source: { plugin: 'restriction-rules', id: 'private-internal-key' },
          selection: { type: 'recordAccess', key: 'public' },
        },
      },
    ],
  };
  mocks.loadOptions.mockResolvedValue(
    wire({
      ...options,
      recordAccess: [
        { value: 'own', label: 'Projects owned by me' },
        { value: 'public', label: 'Non-confidential projects' },
      ],
      sections: withSubsections({
        business: [
          subsection('business.other', 'Other', [
            {
              type: 'composite',
              value: 'quotes',
              label: 'Quotes',
              actions: [{ value: 'view', label: 'View' }],
              dataScopes: {
                view: [
                  {
                    key: 'quotes',
                    label: 'Quotes',
                    collection: 'quotesTable',
                    collectionFields: [],
                    defaultValue: '',
                    options: [
                      { value: '', label: 'Defaults' },
                      { value: 'own', label: 'Projects owned by me' },
                      { value: 'public', label: 'Non-confidential projects' },
                    ],
                  },
                ],
              },
            },
          ]),
        ],
      }),
    }),
  );
  mocks.inspectBatch.mockImplementation(
    (_subject, checks: Omit<AuthorizationInspection, 'decision'>[]) =>
      Promise.resolve(
        checks.map((check) => ({
          ...check,
          decision: {
            effect: 'conditional',
            conditions: { type: 'composite' },
            reasons: [
              grant,
              {
                ...grant,
                plugin: 'database',
                details: {
                  source: grant.details.source,
                  policy: { scopes: { quotes: 'own' } },
                },
              },
              ...database.reasons.slice(1),
            ],
            checks: [
              {
                resource: { type: 'page', id: 'quotesPage' },
                action: 'access',
                decision: { effect: 'permit', reasons: [] },
              },
              {
                resource: { type: 'database.collection', id: 'quotesTable' },
                action: 'read',
                decision: database,
              },
            ],
          },
        })),
      ),
  );
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Quotes: View' }));
  expect(await screen.findByText('Users · Alice')).toBeVisible();
  expect(screen.getByText('Sales assistant')).toBeVisible();
  expect(
    screen.getAllByText(en.inspector.reasonCodes.GRANT_MATCHED, {
      exact: false,
    }),
  ).toHaveLength(1);
  expect(screen.getByText('Projects owned by me')).toBeVisible();
  expect(screen.getByText('Non-confidential projects')).toBeVisible();
  expect(screen.getByText(en.inspector.summary.scoped)).toBeVisible();
  expect(screen.getAllByText(en.inspector.technicalDetails)).toHaveLength(1);
  expect(screen.queryByText('quotesPage · access')).not.toBeInTheDocument();
  const raw = screen.getByText(/"private-internal-key"/);
  expect(raw).not.toBeVisible();
  fireEvent.click(screen.getByText(en.inspector.technicalDetails));
  expect(raw).toBeVisible();
});

it('renders an unregistered plugin explanation and source title without assuming other plugins participated', async () => {
  const { Decision } = await import('../../client/pages/inspector-decision.js');
  render(
    <Decision
      fields={[]}
      value={{
        effect: 'permit',
        reasons: [
          {
            code: 'PROJECT_MEMBERSHIP_CONFIRMED',
            message: 'Project membership permits access.',
            plugin: 'custom-membership',
            details: {
              source: {
                plugin: 'custom-membership',
                id: 'internal-team-id',
                title: 'Project team',
              },
            },
          },
        ],
      }}
    />,
    { wrapper: lenient },
  );
  expect(screen.getByText('Project membership permits access.')).toBeVisible();
  expect(screen.getByText('Project team')).toBeVisible();
  expect(
    screen.queryByText(/default access|sharing|restriction/i),
  ).not.toBeInTheDocument();
});

it('shows a team grant once despite different underlying policies and retains the user-context explanation', async () => {
  const { Decision } = await import('../../client/pages/inspector-decision.js');
  const source = {
    plugin: 'permission-sets',
    id: 'engineer',
    title: 'Sales engineer',
  };
  const grant = {
    code: 'GRANT_MATCHED',
    message: 'business grant',
    details: { source, policy: { scopes: { quotes: 'preparedByMe' } } },
  };
  const databaseGrant = {
    code: 'GRANT_MATCHED',
    message: 'table grant',
    details: { source },
  };
  const context = {
    code: 'USER_CONTEXT_REQUIRED',
    message: 'User context required',
  };
  render(
    <Decision
      fields={[]}
      value={{
        effect: 'deny',
        reasons: [grant, context, databaseGrant],
        checks: [
          {
            resource: { type: 'database.collection', id: 'quotes' },
            action: 'read',
            decision: { effect: 'deny', reasons: [context, databaseGrant] },
          },
        ],
      }}
    />,
    { wrapper },
  );
  expect(screen.getAllByText('Sales engineer')).toHaveLength(1);
  expect(
    screen.getAllByText(en.inspector.reasonCodes.USER_CONTEXT_REQUIRED),
  ).toHaveLength(1);
  expect(screen.queryByText(en.inspector.summary.none)).not.toBeInTheDocument();
});

it('keeps empty page and business sections with development guidance, defaulting to the first populated subsection', async () => {
  mocks.loadOptions.mockResolvedValue(
    wire({
      ...options,
      sections: withSubsections({ pages: [pageSubsection()] }),
    }),
  );
  mocks.inspectConfigured.mockResolvedValue({
    unrestricted: true,
    types: [],
    resources: [],
  });
  mount();
  await screen.findByText(en.permissionWorkspace.development.pages);
  expect(
    screen.getByRole('button', { name: 'Page permissions' }),
  ).toHaveAttribute('aria-current', 'page');
  fireEvent.click(screen.getByRole('button', { name: 'Business permissions' }));
  expect(
    await screen.findByText(en.permissionWorkspace.development.business),
  ).toBeVisible();
  expect(
    screen.queryByRole('img', { name: en.permissionWorkspace.configured }),
  ).not.toBeInTheDocument();
  cleanup();

  // With business resources, the first populated subsection is the default.
  mocks.loadOptions.mockResolvedValue(
    wire({
      ...options,
      sections: withSubsections({
        pages: [pageSubsection()],
        business: [tables],
      }),
    }),
  );
  mount();
  expect(
    await screen.findByRole('button', { name: 'Orders 0: Read' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Page permissions' }));
  expect(
    await screen.findByText(en.permissionWorkspace.development.pages),
  ).toBeInTheDocument();
});

it('shows client-registered pages as the menu tree, in menu order, and inspects them in one batch', async () => {
  const page = (name: string, order: number) => ({
    name,
    packageName: '@test/pages',
    auth: 'required',
    authz: { resource: { type: 'page', id: name }, action: 'access' },
    componentLoader: async () => ({ default: () => null }),
    navigation: { title: name, order },
  });
  mocks.routes = [
    {
      name: 'late',
      packageName: '@test/pages',
      navigation: { title: 'Late group', order: 20 },
      children: [page('late-page', 0)],
    },
    page('home', 5),
    {
      name: 'early',
      packageName: '@test/pages',
      navigation: { title: 'Early group', order: 10 },
      children: [
        page('second', 2),
        {
          name: 'nested',
          packageName: '@test/pages',
          navigation: { title: 'Nested group', order: 1 },
          children: [page('deep', 0)],
        },
      ],
    },
  ] as AppClientRegisteredRoute[];
  mocks.loadOptions.mockResolvedValue(
    wire({
      ...options,
      sections: withSubsections({ pages: [pageSubsection()] }),
    }),
  );
  mount(undefined, lenient);
  await screen.findByRole('button', { name: 'deep: Access' });
  expect(
    screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.textContent?.replace('Access', '')),
  ).toEqual([
    'home',
    'Early group',
    'Nested group',
    'deep',
    'second',
    'Late group',
    'late-page',
  ]);
  expect(screen.getByRole('button', { name: 'Early group' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(mocks.inspectBatch).toHaveBeenCalledWith(
    { type: 'user', id: 'alice' },
    expect.arrayContaining(
      ['home', 'deep', 'second', 'late-page'].map((id) => ({
        resource: { type: 'page', id },
        action: 'access',
      })),
    ),
  );
  expect(
    screen.queryByText(en.inspector.noRegisteredResources),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Early group' }));
  expect(screen.queryByText('deep')).not.toBeInTheDocument();
  expect(screen.getByText('late-page')).toBeVisible();
});

it('removes redundant display conditions without mutating the executable scope', () => {
  const condition = (value: string) => ({
    kind: 'condition',
    path: ['projectId'],
    operator: '$eq',
    value,
  });
  const root = {
    kind: 'group',
    logic: 'and',
    items: [
      condition('project-1'),
      {
        kind: 'group',
        logic: 'or',
        items: [condition('project-1'), condition('project-2')],
      },
    ],
  };
  const original = JSON.stringify(root);
  render(
    <InspectionConditions
      value={{ type: 'database', scope: { kind: 'filter', root }, fields: [] }}
    />,
    { wrapper },
  );
  expect(screen.getByText(/project-1/)).toBeVisible();
  expect(screen.queryByText(/project-2/)).not.toBeInTheDocument();
  expect(JSON.stringify(root)).toBe(original);
});
it('shows the inherited subjects and which one brings each granting set', async () => {
  mocks.resolveSubjects.mockImplementation(
    (_settings: string, type: string, ids: readonly string[]) =>
      Promise.resolve(
        ids.map((id) => ({
          id,
          title:
            type === 'department'
              ? `${id[0]!.toUpperCase()}${id.slice(1)} department`
              : 'Alice',
        })),
      ),
  );
  mocks.inspectConfigured.mockResolvedValue({
    unrestricted: false,
    types: ['database.collection'],
    resources: [{ type: 'database.collection', id: 'orders0' }],
    identity: {
      subjects: [
        { type: 'authenticated', id: '*' },
        { type: 'department', id: 'east' },
      ],
    },
    sets: [
      {
        key: 'sales',
        title: 'Sales',
        sources: [{ type: 'department', id: 'east' }],
      },
      { key: 'own', sources: [{ type: 'user', id: 'alice' }] },
      { key: 'member', sources: [] },
    ],
  });
  const grant = (id: string, title: string) => ({
    code: 'GRANT_MATCHED',
    message: `${id} grants`,
    details: { source: { plugin: 'permission-sets', id, title } },
  });
  mocks.inspectBatch.mockImplementation(
    (_subject: unknown, checks: Omit<AuthorizationInspection, 'decision'>[]) =>
      Promise.resolve(
        checks.map((check) => ({
          ...check,
          decision: {
            effect: 'permit',
            reasons: [
              grant('sales', 'Sales'),
              grant('own', 'Own'),
              grant('member', 'Member'),
            ],
          },
        })),
      ),
  );
  mount('/?subjectType=user&subjectId=alice');
  expect(
    await screen.findByText(
      `${en.inspector.inheritsFrom} All signed-in users, East department (Departments)`,
    ),
  ).toBeInTheDocument();
  fireEvent.click(
    await screen.findByRole(
      'button',
      { name: 'Orders 0: Read' },
      { timeout: 5000 },
    ),
  );
  const dialog = screen.getByRole('dialog');
  expect(
    within(dialog).getByText('· via East department', { exact: false }),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByText(`· ${en.inspector.grantedDirectly}`, {
      exact: false,
    }),
  ).toBeInTheDocument();
  const member = within(dialog).getByText('Member').closest('p')!;
  expect(member.textContent).not.toMatch(/via|directly/);
});
