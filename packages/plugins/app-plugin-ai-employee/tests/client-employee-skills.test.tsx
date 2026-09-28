/** @vitest-environment jsdom */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIEmployeeRecord } from '../client/ai-employee-service.js';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';
import AIEmployeePage from '../client/pages/ai-employee-page.js';

const mocks = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn(), close: vi.fn() },
}));
vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => mocks.api,
  createApiClient: () => mocks.api,
  resolveAppUrl: (value: string) => value,
  useToaster: () => mocks.toaster,
}));
vi.mock('../client/locales/index.js', () => ({
  useT: () => (key: string, options?: { name?: string }) => {
    const value = key.startsWith('employeeSkills.')
      ? enUS.employeeSkills[
          key.slice(
            'employeeSkills.'.length,
          ) as keyof typeof enUS.employeeSkills
        ]
      : key;
    return value.replace('{{name}}', options?.name ?? '');
  },
}));

const catalog = [
  {
    name: 'general',
    scope: 'GENERAL',
    introduction: { title: 'General research' },
    description: 'Research description',
  },
  {
    name: 'specified',
    scope: 'SPECIFIED',
    introduction: { title: 'Special analysis' },
    description: 'Analyze data',
  },
  {
    name: 'custom',
    scope: 'CUSTOM',
    title: 'Custom writing',
    description: 'Write documents',
  },
  { name: 'unscoped', description: 'No scope metadata' },
];
let employee: AIEmployeeRecord;
let loadCatalog: () => Promise<unknown>;

beforeEach(() => {
  vi.resetAllMocks();
  employee = {
    username: 'ellis',
    nickname: 'Ellis',
    enabled: true,
    skillSettings: {
      skills: ['custom', 'missing'],
      tools: [{ name: 'search', autoCall: true }],
    },
  };
  loadCatalog = async () => catalog;
  mocks.api.request.mockImplementation(
    async ({
      path,
      json,
    }: {
      path: string;
      json?: Partial<AIEmployeeRecord>;
    }) => {
      if (path === 'ai/aiEmployees:list') return [employee];
      if (path === 'ai/aiEmployees:get') return employee;
      if (path === 'ai/aiEmployees:update') {
        employee = { ...employee, ...json };
        return employee;
      }
      if (path === 'ai/aiSkills:list') return loadCatalog();
      return [];
    },
  );
});
afterEach(cleanup);

async function renderSkills() {
  render(<AIEmployeePage />);
  // The first render in this file transforms the page's whole import graph, which can outlast findBy's default 1 s
  // when a runner executes every package's tests at once.
  await screen.findByRole('heading', { name: 'Ellis' }, { timeout: 10_000 });
  fireEvent.click(screen.getByRole('tab', { name: 'Skills' }));
}
function skillSwitch(name: string) {
  return screen.getByRole('switch', { name: `Use ${name}` });
}
function savedPayload() {
  return mocks.api.request.mock.calls.find(
    ([request]) => request.path === 'ai/aiEmployees:update',
  )?.[0].json;
}
async function save() {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument(),
  );
}

describe('employee Skills selection', () => {
  it('shows all catalog scopes in one divider list using actual shared switches and readable metadata', async () => {
    await renderSkills();
    const list = screen.getByRole('list', { name: 'Skills' });
    expect(
      within(list)
        .getAllByRole('switch')
        .map((control) => control.getAttribute('aria-label')),
    ).toEqual([
      'Use Custom writing',
      'Use General research',
      'Use missing',
      'Use Special analysis',
      'Use unscoped',
    ]);
    expect(list).toHaveClass('divide-y', 'divide-border');
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(within(list).getAllByRole('switch')).toHaveLength(5);
    for (const control of within(list).getAllByRole('switch')) {
      expect(control).toHaveAttribute('data-slot', 'switch');
      expect(control.closest('details')).toBeNull();
    }
    expect(screen.getByText('general')).toBeVisible();
    expect(screen.getByText('Research description')).toBeVisible();
    expect(screen.getByText('Analyze data')).toBeVisible();
    expect(screen.getByText('Unavailable')).toBeVisible();
    expect(skillSwitch('unscoped')).not.toBeChecked();
    expect(screen.queryByText('General skills')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Employee-specific skills'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Custom skills')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add skill' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
  });

  it.each([undefined, null])(
    'inherits GENERAL plus configured skills for legacy override %s',
    async (enabledSkills) => {
      if (enabledSkills === null) employee.skillSettings!.enabledSkills = null;
      await renderSkills();
      expect(skillSwitch('General research')).toBeChecked();
      expect(skillSwitch('Custom writing')).toBeChecked();
      expect(skillSwitch('missing')).toBeChecked();
      expect(skillSwitch('Special analysis')).not.toBeChecked();
      fireEvent.click(skillSwitch('General research'));
      fireEvent.click(skillSwitch('Special analysis'));
      await save();
      expect(savedPayload().skillSettings).toEqual({
        enabledSkills: ['custom', 'missing', 'specified'],
        skills: ['custom', 'missing'],
        tools: [{ name: 'search', autoCall: true }],
      });
      expect(skillSwitch('General research')).not.toBeChecked();
      expect(skillSwitch('Special analysis')).toBeChecked();
    },
  );

  it('treats an explicit empty list as none and resets without materializing inherited selections', async () => {
    employee.skillSettings!.enabledSkills = [];
    await renderSkills();
    for (const control of within(
      screen.getByRole('list', { name: 'Skills' }),
    ).getAllByRole('switch'))
      expect(control).not.toBeChecked();
    fireEvent.click(skillSwitch('Special analysis'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(skillSwitch('Special analysis')).not.toBeChecked();
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
    fireEvent.click(skillSwitch('General research'));
    fireEvent.click(skillSwitch('General research'));
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Enabled' }));
    await save();
    expect(savedPayload().skillSettings.enabledSkills).toEqual([]);
  });

  it('preserves authoritative unknown names, shows unavailable saved legacy names as off, and can turn everything off', async () => {
    employee.skillSettings!.enabledSkills = ['unknown-override'];
    await renderSkills();
    expect(skillSwitch('unknown-override')).toBeChecked();
    expect(skillSwitch('missing')).not.toBeChecked();
    expect(skillSwitch('General research')).not.toBeChecked();
    fireEvent.click(skillSwitch('Special analysis'));
    await save();
    expect(savedPayload().skillSettings.enabledSkills).toEqual([
      'unknown-override',
      'specified',
    ]);
    fireEvent.click(skillSwitch('unknown-override'));
    expect(skillSwitch('unknown-override')).not.toBeChecked();
    fireEvent.click(skillSwitch('Special analysis'));
    await save();
    expect(employee.skillSettings?.enabledSkills).toEqual([]);
  });

  it('reset restores inherited values and unrelated saves preserve omission', async () => {
    await renderSkills();
    fireEvent.click(skillSwitch('General research'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(skillSwitch('General research')).toBeChecked();
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Enabled' }));
    await save();
    expect(savedPayload().skillSettings).not.toHaveProperty('enabledSkills');
  });

  it.each(
    [undefined, null, [], ['unknown-override']].map((enabledSkills) => ({
      enabledSkills,
    })),
  )(
    'does not reset override $enabledSkills when catalog fails or while retrying',
    async ({ enabledSkills }) => {
      if (enabledSkills !== undefined)
        employee.skillSettings!.enabledSkills = enabledSkills;
      loadCatalog = async () => {
        throw new Error('Catalog failed');
      };
      await renderSkills();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        enUS.employeeSkills.error,
      );
      expect(skillSwitch('missing')).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(skillSwitch('missing'));
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('switch', { name: 'Enabled' }));
      await save();
      if (enabledSkills === undefined)
        expect(savedPayload().skillSettings).not.toHaveProperty(
          'enabledSkills',
        );
      else
        expect(savedPayload().skillSettings.enabledSkills).toEqual(
          enabledSkills,
        );
      let resolveCatalog!: (items: typeof catalog) => void;
      loadCatalog = () =>
        new Promise((resolve) => {
          resolveCatalog = resolve;
        });
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(screen.getByRole('status')).toHaveTextContent(
        enUS.employeeSkills.loading,
      );
      expect(skillSwitch('missing')).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(screen.getByRole('tab', { name: 'Role settings' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Role settings' }), {
        target: { value: 'Keep this draft' },
      });
      await act(async () => resolveCatalog(catalog));
      expect(
        screen.getByRole('textbox', { name: 'Role settings' }),
      ).toHaveValue('Keep this draft');
      fireEvent.click(screen.getByRole('tab', { name: 'Skills' }));
      expect(skillSwitch('Special analysis')).not.toHaveAttribute(
        'aria-disabled',
        'true',
      );
      expect(skillSwitch('General research')).toHaveAttribute(
        'aria-checked',
        String(enabledSkills == null),
      );
      expect(
        mocks.api.request.mock.calls.filter(
          ([request]) => request.path === 'ai/aiEmployees:get',
        ),
      ).toHaveLength(1);
    },
  );

  it('disables saved-name switches while the initial catalog is loading without blocking unrelated edits', async () => {
    let resolveCatalog!: (items: typeof catalog) => void;
    loadCatalog = () =>
      new Promise((resolve) => {
        resolveCatalog = resolve;
      });
    await renderSkills();
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.employeeSkills.loading,
    );
    expect(skillSwitch('missing')).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('switch', { name: 'Enabled' }));
    await save();
    expect(savedPayload().skillSettings).not.toHaveProperty('enabledSkills');
    await act(async () => resolveCatalog(catalog));
    expect(skillSwitch('General research')).toBeChecked();
    expect(skillSwitch('missing')).not.toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
  });

  it('provides localized interpolated accessible labels', () => {
    expect(enUS.employeeSkills.use).toBe('Use {{name}}');
    expect(zhCN.employeeSkills.use).toBe('使用{{name}}');
  });
});
