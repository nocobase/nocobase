// @vitest-environment jsdom
import { useState } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type DataScopeRuleAction,
  DataScopesEditor,
} from '../../client/components/data-scopes-editor.js';
import type {
  AuthorizationOptions,
  AuthorizationOptionsResponse,
  AuthorizationSubject,
  SubjectTypeOption,
} from '../../client/authorization-client.js';
import { subsection, withSubsections } from '../helpers/workspace-options.js';
import { selectOption } from '../helpers/select-option.js';
import type { FilterNode } from '@nocobase/db';
import { FilterEditor } from '../../client/components/filter-editor.js';
import {
  emptyFilter,
  incompleteFilter,
} from '../../client/components/filter-ast.js';
import { assertDatabaseScope, scopeAst } from '../../server/database/scope.js';
import en from '../../client/locales/en-US.js';
import { SubjectsEditor } from '../../client/components/subjects-editor.js';
import { SelectField } from '../../client/components/select-field.js';
import { Dialog } from '@base-ui/react/dialog';
import { TablePager } from '../../client/components/management-ui.js';
import { pageSlice } from '../../client/components/pagination.js';
import { TestI18nProvider } from '@nocobase/i18n/testing';
import { createAuthorizationI18n, i18nWrapper } from '../helpers/i18n.js';
import { useAuthorizationPageData } from '../../client/pages/page-support.js';
import { useSubjectNames } from '../../client/components/use-subject-names.js';
import { localizeOptions } from '../../client/components/localized-options.js';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';

const client = vi.hoisted(() => ({
  listSubjects: vi.fn(),
  resolveSubjects: vi.fn(),
  loadOptions: vi.fn(),
}));
vi.mock('../../client/use-authorization-client.js', () => ({
  useAuthorizationClient: () => client,
}));

// The editors render under this plugin's routes.
const wrapper = i18nWrapper(
  await createAuthorizationI18n(),
  AUTHORIZATION_NAMESPACE,
);

describe('the data scopes editor', () => {
  const options: AuthorizationOptions = {
    sections: withSubsections({
      business: [
        subsection('business.other', 'Other', [
          {
            type: 'composite',
            value: 'sales',
            label: 'Sales',
            actions: [{ value: 'submit', label: 'Submit' }],
            dataScopes: {
              submit: ['projects', 'quotes'].map((key) => ({
                key,
                label: key === 'projects' ? 'Projects' : 'Quotes',
                collection: key,
                collectionFields: [],
                defaultValue: '',
                options: [{ value: '', label: 'Defaults' }],
              })),
            },
          },
        ]),
      ],
    }),
    subjectTypes: [],
    recordAccess: [],
    collections: [
      { name: 'projects', fields: ['id', 'title'] },
      { name: 'quotes', fields: ['id', 'amount'] },
    ],
  };
  it('uses the declared table for each record picker and preserves its sibling scope when edited', async () => {
    const load = vi.fn(async (collection: string) => [
      { id: `${collection}-1`, label: `${collection} record` },
    ]);
    function Harness() {
      const [value, setValue] = useState<readonly DataScopeRuleAction[]>([
        {
          action: 'submit',
          scopeKey: 'projects',
          selection: { type: 'records', ids: [] },
        },
        {
          action: 'submit',
          scopeKey: 'quotes',
          selection: { type: 'records', ids: ['quotes-1'] },
        },
      ]);
      return (
        <>
          <DataScopesEditor
            options={options}
            resourceId='sales'
            value={value}
            onChange={setValue}
            loadRecords={load}
          />
          <output data-testid='value'>{JSON.stringify(value)}</output>
        </>
      );
    }
    render(<Harness />, { wrapper });
    expect(screen.getAllByRole('heading', { name: 'Submit' })).toHaveLength(1);
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(screen.queryByText('Record access policy')).not.toBeInTheDocument();
    await waitFor(() => expect(load).toHaveBeenCalledWith('projects'));
    expect(load).toHaveBeenCalledWith('quotes');
    const projectSection = screen
      .getByRole('checkbox', { name: 'Projects' })
      .closest('section')!;
    await within(projectSection).findByText('projects record');
    expect(within(projectSection).queryByText('quotes record')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Projects' }));
    expect(JSON.parse(screen.getByTestId('value').textContent!)).toEqual([
      {
        action: 'submit',
        scopeKey: 'quotes',
        selection: { type: 'records', ids: ['quotes-1'] },
      },
    ]);
  });
});

describe('the filter editor', () => {
  function Editor({ initial = emptyFilter() }: { initial?: FilterNode }) {
    const [value, setValue] = useState<FilterNode>(initial);
    return (
      <>
        <FilterEditor
          fields={['status', 'amount']}
          value={value}
          onChange={setValue}
        />
        <output data-testid='ast'>{JSON.stringify(value)}</output>
      </>
    );
  }
  it('outputs nested native AND/OR nodes with typed values accepted by the authorization boundary', async () => {
    render(<Editor />, { wrapper });
    fireEvent.click(
      screen.getByRole('button', { name: en.databasePolicy.addCondition }),
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: en.databasePolicy.filterValue }),
      { target: { value: 'published' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: en.filterEditor.addGroup }),
    );
    await selectOption(
      screen.getAllByRole('combobox', { name: en.filterEditor.logic })[1]!,
      en.filterEditor.any,
    );
    fireEvent.click(
      screen.getAllByRole('button', {
        name: en.databasePolicy.addCondition,
      })[1]!,
    );
    await selectOption(
      screen.getAllByRole('combobox', {
        name: en.databasePolicy.filterField,
      })[1]!,
      'amount',
    );
    await selectOption(
      screen.getAllByRole('combobox', { name: en.filterEditor.valueType })[1]!,
      en.filterEditor.number,
    );
    fireEvent.change(
      screen.getByRole('spinbutton', { name: en.databasePolicy.filterValue }),
      { target: { value: '42' } },
    );
    const ast = JSON.parse(
      screen.getByTestId('ast').textContent!,
    ) as FilterNode;
    expect(ast).toEqual({
      kind: 'group',
      logic: 'and',
      items: [
        {
          kind: 'condition',
          path: ['status'],
          operator: '$eq',
          value: 'published',
        },
        {
          kind: 'group',
          logic: 'or',
          items: [
            { kind: 'condition', path: ['amount'], operator: '$eq', value: 42 },
          ],
        },
      ],
    });
    expect(() => assertDatabaseScope(ast, ['status', 'amount'])).not.toThrow();
    expect(scopeAst('orders', ast)).toMatchObject({
      kind: 'filter',
      version: 1,
      collection: 'orders',
      root: ast,
    });
    expect(incompleteFilter(ast)).toBe(false);
  });
  it('preserves unsupported nodes when editing a sibling and flags empty nested groups', () => {
    const relation = {
      kind: 'relation',
      path: ['owner'],
      quantifier: 'exists',
    } as const;
    render(
      <Editor initial={{ kind: 'group', logic: 'or', items: [relation] }} />,
      { wrapper },
    );
    expect(screen.getByText(en.filterEditor.unsupported)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: en.filterEditor.addGroup }),
    );
    const ast = JSON.parse(
      screen.getByTestId('ast').textContent!,
    ) as FilterNode;
    expect(ast).toMatchObject({
      items: [relation, { kind: 'group', logic: 'and', items: [] }],
    });
    expect(incompleteFilter(ast)).toBe(true);
  });
});

describe('the subjects editor', () => {
  const types: readonly SubjectTypeOption[] = [
    {
      value: 'authenticated',
      label: 'Everyone',
      selection: { type: 'fixed', id: '*' },
    },
    {
      value: 'department',
      label: 'Departments',
      selection: { type: 'collection' },
    },
    {
      value: 'position',
      label: 'Positions',
      selection: { type: 'collection' },
    },
  ];
  function Editor({ initial = [] }: { initial?: AuthorizationSubject[] }) {
    const [value, setValue] =
      useState<readonly AuthorizationSubject[]>(initial);
    return (
      <>
        <SubjectsEditor
          types={types}
          settings='sharing-rules'
          value={value}
          onChange={setValue}
        />
        <output data-testid='value'>{JSON.stringify(value)}</output>
      </>
    );
  }
  beforeEach(() => {
    vi.resetAllMocks();
    client.resolveSubjects.mockImplementation(
      (_settings: string, _type: string, ids: string[]) =>
        Promise.resolve(ids.map((id) => ({ id, title: `Resolved ${id}` }))),
    );
    client.listSubjects.mockImplementation(
      (_settings: string, type: string, query: { page: number }) =>
        Promise.resolve({
          items: [{ id: String(query.page), title: `${type} ${query.page}` }],
          total: 60,
        }),
    );
  });
  it('loads registered types and preserves selections across pages and types', async () => {
    render(<Editor />, { wrapper });
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'department 1' }),
    );
    fireEvent.click(screen.getByRole('button', { name: en.subjects.next }));
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'department 2' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Positions' }));
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'position 1' }),
    );
    expect(JSON.parse(screen.getByTestId('value').textContent!)).toEqual([
      { type: 'department', id: '1' },
      { type: 'department', id: '2' },
      { type: 'position', id: '1' },
    ]);
    fireEvent.change(
      screen.getByRole('textbox', { name: en.subjects.search }),
      {
        target: { value: 'manager' },
      },
    );
    await waitFor(() =>
      expect(client.listSubjects).toHaveBeenLastCalledWith(
        'sharing-rules',
        'position',
        { page: 1, pageSize: 30, search: 'manager' },
      ),
    );
  });
  it('resolves off-page names and retains unknown subjects when lookup is refused', async () => {
    client.resolveSubjects.mockRejectedValue(new Error('Forbidden'));
    client.listSubjects.mockRejectedValue(new Error('Forbidden'));
    render(
      <Editor
        initial={[
          { type: 'department', id: 'off-page' },
          { type: 'missing-plugin', id: 'saved' },
        ]}
      />,
      { wrapper },
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden');
    expect(screen.getByTestId('value')).toHaveTextContent('saved');
    expect(screen.getByText('off-page (unresolved)')).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole('button', { name: en.common.remove })[0]!,
    );
    expect(screen.getByTestId('value')).not.toHaveTextContent('off-page');
  });
  it('resolves more than 100 selections in batches', async () => {
    render(
      <Editor
        initial={Array.from({ length: 125 }, (_, index) => ({
          type: 'department',
          id: String(index),
        }))}
      />,
      { wrapper },
    );
    await screen.findByText('Resolved 124');
    expect(
      client.resolveSubjects.mock.calls.map(
        (call) => (call[2] as string[]).length,
      ),
    ).toEqual([100, 25]);
  });
});

describe('the select field', () => {
  function Editor() {
    const [value, setValue] = useState('');
    return (
      <SelectField
        aria-label='Group'
        value={value}
        onValueChange={setValue}
        options={[
          { value: '', label: 'All groups' },
          { value: 'sales', label: 'Sales' },
        ]}
      />
    );
  }

  it('shows labels, highlights the current selection, and allows returning to an empty-valued option inside a dialog', async () => {
    render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Title>Scope</Dialog.Title>
            <Editor />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
      { wrapper },
    );
    const trigger = screen.getByRole('combobox', { name: 'Group' });
    expect(trigger).toHaveTextContent('All groups');
    await selectOption(trigger, 'Sales');
    expect(trigger).toHaveTextContent('Sales');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(trigger);
    expect(
      await screen.findByRole('option', { name: 'Sales' }),
    ).toHaveAttribute('aria-selected', 'true');
    const all = screen.getByRole('option', { name: 'All groups' });
    fireEvent.pointerDown(all);
    fireEvent.click(all);
    expect(trigger).toHaveTextContent('All groups');
  });
});

describe('pagination', () => {
  const rows = Array.from({ length: 23 }, (_, index) => index + 1);

  it.each([
    ['the first page', rows, 1, rows.slice(0, 10)],
    ['the last, partial page', rows, 3, rows.slice(20)],
    [
      'a page beyond the end of a narrowed list',
      rows.slice(0, 4),
      3,
      rows.slice(0, 4),
    ],
  ])(
    'slices %s out of the rows the panel already holds',
    (_name, all, page, expected) => {
      expect(pageSlice(all, page, 10)).toEqual(expected);
    },
  );

  it('states the range, disables the edges of the list, and offers no paging when there is nothing to page', () => {
    const seen: number[] = [];
    const { unmount } = render(
      <TablePager
        label='Rules'
        page={1}
        total={23}
        onPage={(page) => seen.push(page)}
      />,
      { wrapper },
    );
    expect(screen.getByText('1–10 of 23')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(seen).toEqual([2]);
    unmount();

    render(
      <TablePager label='Rules' page={1} total={0} onPage={() => undefined} />,
      { wrapper },
    );
    expect(screen.queryByRole('button', { name: 'Next page' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Previous page' })).toBeNull();
  });
});

describe('localized options', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('switches option labels and fixed subjects without refetching or losing edits', async () => {
    client.loadOptions.mockResolvedValue({
      sections: [],
      collections: [],
      recordAccess: [],
      subjectTypes: [
        {
          type: 'authenticated',
          title: {
            key: 'options.subjectTypes.authenticated',
            ns: AUTHORIZATION_NAMESPACE,
          },
          selection: { type: 'fixed', id: '*' },
        },
        {
          type: 'user',
          title: {
            key: 'options.subjectTypes.user',
            ns: AUTHORIZATION_NAMESPACE,
          },
          selection: { type: 'collection' },
        },
      ],
    });
    client.resolveSubjects.mockResolvedValue([{ id: '1', title: 'Alice' }]);
    const runtime = await createAuthorizationI18n();
    function Page() {
      const { options } = useAuthorizationPageData('sharing-rules');
      const [draft, setDraft] = useState('');
      const names = useSubjectNames(
        'sharing-rules',
        options?.subjectTypes ?? [],
        [{ type: 'user', id: '1' }],
      );
      return (
        <>
          <input
            aria-label='draft'
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <p>{options?.subjectTypes[1]?.label}</p>
          {Object.entries(names).map(([key, name]) => (
            <p key={key}>{name}</p>
          ))}
        </>
      );
    }
    render(
      <TestI18nProvider runtime={runtime}>
        <Page />
      </TestI18nProvider>,
    );
    await screen.findByText('All signed-in users');
    await screen.findByText('Alice');
    fireEvent.change(screen.getByLabelText('draft'), {
      target: { value: 'Unsaved' },
    });
    await act(() => runtime.changeLanguage('zh-CN'));
    await screen.findByText('所有已登录用户');
    await waitFor(() =>
      expect(screen.queryByText('All signed-in users')).toBeNull(),
    );
    expect(screen.getByLabelText('draft')).toHaveValue('Unsaved');
    expect(client.loadOptions).toHaveBeenCalledTimes(1);
    expect(client.resolveSubjects).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('resolves groups, sections, subsections and plugin namespaces while preserving literal names and fallbacks', () => {
    const descriptor = {
      key: 'resourceTitle',
      ns: '@example/plugin',
      defaultValue: 'Fallback',
    };
    const raw: AuthorizationOptionsResponse = {
      sections: [
        {
          name: 'administration',
          title: {
            key: 'sections.administration',
            ns: AUTHORIZATION_NAMESPACE,
          },
          order: 200,
          subsections: [
            {
              name: 'administration.other',
              title: { key: 'sections.other', ns: AUTHORIZATION_NAMESPACE },
              resources: [
                {
                  type: 'settings',
                  id: 'literal',
                  title: 'resourceTitle',
                  description: descriptor,
                  group: 'child',
                  actions: [{ name: 'read', title: descriptor }],
                },
                {
                  type: 'settings',
                  id: 'first',
                  title: 'First',
                  group: 'late',
                  actions: [],
                },
                { type: 'settings', id: 'loose', title: 'Loose', actions: [] },
              ],
            },
          ],
        },
        {
          name: 'pages',
          title: 'Pages',
          order: 0,
          subsections: [
            {
              name: 'page',
              title: 'Pages',
              recordType: {
                type: 'page',
                actions: [{ name: 'access', title: 'Access' }],
              },
              resources: [],
            },
          ],
        },
      ],
      resourceGroups: [
        { name: 'parent', title: 'Parent' },
        { name: 'late', title: 'Late', parent: 'parent', order: 10 },
        { name: 'child', title: descriptor, parent: 'parent' },
        { name: 'unused', title: 'Unused' },
      ],
      collections: [],
      subjectTypes: [],
      recordAccess: [
        {
          key: 'custom',
          title: 'Custom',
          description: descriptor,
          collections: [],
        },
      ],
    };
    const t = vi.fn(
      (_key: string, options?: Readonly<Record<string, unknown>>) =>
        String(options?.defaultValue),
    );
    const result = localizeOptions(raw, t);
    const other = result.sections[1]?.subsections[0];
    expect(other?.label).toBe('sections.other');
    // Groups nest under their parent, by order then registration; unused ones drop.
    expect(other?.groups).toEqual([
      {
        value: 'parent',
        label: 'Parent',
        children: [
          { value: 'child', label: 'Fallback' },
          { value: 'late', label: 'Late' },
        ],
      },
    ]);
    // Ungrouped resources first, then each group's in tree order.
    expect(other?.resources.map((item) => item.value)).toEqual([
      'loose',
      'literal',
      'first',
    ]);
    expect(other?.resources[1]).toMatchObject({
      type: 'settings',
      label: 'resourceTitle',
      description: 'Fallback',
    });
    expect(other?.actions).toEqual([{ value: 'read', label: 'Fallback' }]);
    expect(result.sections[0]?.subsections[0]).toEqual({
      value: 'page',
      label: 'Pages',
      recordType: 'page',
      actions: [{ value: 'access', label: 'Access' }],
      groups: [],
      resources: [],
    });
    expect(result.recordAccess[0]?.description).toBe('Fallback');
    expect(result.sections.map((section) => section.value)).toEqual([
      'pages',
      'administration',
    ]);
    // Section titles are catalogued in this plugin's namespace.
    expect(t).toHaveBeenCalledWith('sections.administration', {
      ns: AUTHORIZATION_NAMESPACE,
      defaultValue: 'sections.administration',
    });
    expect(t).toHaveBeenCalledWith('resourceTitle', {
      ns: '@example/plugin',
      defaultValue: 'Fallback',
    });
    expect(raw.sections[0]?.subsections[0]?.resources[0]?.description).toBe(
      descriptor,
    );
  });
});
