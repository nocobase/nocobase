// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import type {
  PermissionSetAssignment,
  SubjectTypeOption,
} from '../../client/authorization-client.js';

const NS = '@example/departments';
const api = vi.hoisted(() => ({
  can: vi.fn(async () => true),
  revision: () => 0,
  onInvalidated: vi.fn(() => () => {}),
  resolveSubjects: vi.fn(),
  listSubjects: vi.fn(),
}));
vi.mock('../../client/use-authorization-client.js', () => ({
  useAuthorizationClient: () => api,
}));
import { SubjectsEditor } from '../../client/components/subjects-editor.js';
import { Assignments } from '../../client/pages/permission-sets/assignments-tab.js';
import { createAuthorizationI18n, i18nWrapper } from '../helpers/i18n.js';

const wrapper = i18nWrapper(
  await createAuthorizationI18n({
    // Another plugin's namespace, which owns the subject titles.
    namespaces: {
      [NS]: { seed: { north: 'North Sales', sales: 'Sales Center' } },
    },
  }),
);

const types: readonly SubjectTypeOption[] = [
  {
    value: 'department',
    label: 'Departments',
    selection: { type: 'collection' },
  },
];
const north = { key: 'seed.north', ns: NS };
const sales = { key: 'seed.sales', ns: NS };

beforeEach(() => {
  vi.clearAllMocks();
  api.resolveSubjects.mockImplementation(
    (_settings: string, _type: string, ids: readonly string[]) =>
      Promise.resolve(ids.map((id) => ({ id, title: north }))),
  );
  api.listSubjects.mockResolvedValue({
    items: [{ id: 'north', title: north, description: sales }],
    total: 1,
  });
});

it('renders a descriptor subject title in the assignment list', async () => {
  const assignments: readonly PermissionSetAssignment[] = [
    {
      id: 'a1',
      permissionSet: 'sales',
      subject: { type: 'department', id: 'north' },
    },
  ];
  render(
    <MemoryRouter>
      <Assignments
        assignments={assignments}
        canAssign
        canRevoke
        busy={false}
        subjectTypes={types}
        onAssign={() => Promise.resolve()}
        onRevoke={() => Promise.resolve()}
      />
    </MemoryRouter>,
    { wrapper },
  );
  expect(
    await screen.findByRole('cell', { name: 'North Sales' }),
  ).toBeInTheDocument();
});

it('renders descriptor titles and descriptions in the subject picker', async () => {
  render(
    <SubjectsEditor
      types={types}
      settings='permission-sets'
      value={[]}
      onChange={() => undefined}
    />,
    { wrapper },
  );
  expect(
    await screen.findByRole('checkbox', { name: 'North Sales' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Sales Center')).toBeInTheDocument();
});
