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
import { RouterProvider } from 'react-router';
import { createEmployeeTestRouter } from './employee-test-router.js';

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
  useT:
    () => (key: string, options?: { name?: string; permission?: string }) => {
      const value = key.startsWith('employeeTools.')
        ? enUS.employeeTools[
            key.slice(
              'employeeTools.'.length,
            ) as keyof typeof enUS.employeeTools
          ]
        : key;
      return value
        .replace('{{name}}', options?.name ?? '')
        .replace('{{permission}}', options?.permission ?? '');
    },
}));
const catalog = [
  {
    definition: { name: 'general', description: 'General description' },
    introduction: { title: 'General tool', about: 'General **introduction**' },
    scope: 'GENERAL',
    from: 'loader',
    defaultPermission: 'ALLOW',
  },
  {
    definition: { name: 'mcp' },
    introduction: { title: 'MCP search' },
    scope: 'GENERAL',
    from: 'mcp',
    defaultPermission: 'ASK',
  },
  {
    definition: { name: 'specified' },
    introduction: { title: 'Specified tool' },
    scope: 'SPECIFIED',
    from: 'loader',
    defaultPermission: 'ALLOW',
  },
  {
    definition: { name: 'custom' },
    introduction: { title: 'Custom tool' },
    scope: 'CUSTOM',
    from: 'workflow',
    defaultPermission: 'ALLOW',
  },
  {
    definition: { name: 'customDefault' },
    introduction: { title: 'Default custom' },
    scope: 'CUSTOM',
    from: 'workflow',
    defaultPermission: 'ALLOW',
  },
  {
    definition: { name: 'skillTool' },
    introduction: { title: 'Skill tool' },
    scope: 'SPECIFIED',
    from: 'loader',
    defaultPermission: 'ASK',
  },
  {
    definition: { name: 'disabledSkillTool' },
    scope: 'SPECIFIED',
    from: 'loader',
    defaultPermission: 'ASK',
  },
  { definition: { name: 'unscoped' }, defaultPermission: 'ASK' },
  ...[
    'getSkill',
    'subAgentWebSearch',
    'knowledge-base-retrieve',
    'aiEmployeeWorkflowTaskOutput',
  ].map((name) => ({
    definition: { name },
    scope: 'SPECIFIED',
    defaultPermission: 'ALLOW',
  })),
];
const skills = [
  {
    name: 'generalSkill',
    scope: 'GENERAL',
    tools: ['skillTool', 'missingSkillTool'],
  },
  { name: 'customSkill', scope: 'CUSTOM', tools: ['customDefault'] },
  { name: 'disabledSkill', scope: 'SPECIFIED', tools: ['disabledSkillTool'] },
];
let employee: AIEmployeeRecord;
let loadCatalog: () => Promise<unknown>;
let loadSkills: () => Promise<unknown>;
beforeEach(() => {
  vi.resetAllMocks();
  employee = {
    username: 'ellis',
    nickname: 'Ellis',
    enabled: true,
    skillSettings: {
      skills: ['customSkill'],
      tools: [
        { name: 'custom', autoCall: false, preserved: 'yes' },
        { name: 'missing', autoCall: true },
        { name: 'specified', autoCall: false },
      ],
    },
  };
  loadCatalog = async () => catalog;
  loadSkills = async () => skills;
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
      if (path === 'ai/aiTools:list') return loadCatalog();
      if (path === 'ai/aiSkills:list') return loadSkills();
      return [];
    },
  );
});
afterEach(cleanup);
async function renderTools() {
  const router = createEmployeeTestRouter();
  await act(async () => render(<RouterProvider router={router} />));
  // The first render in this file transforms the page's whole import graph, which can outlast findBy's default 1 s
  // when a runner executes every package's tests at once.
  await screen.findByRole('heading', { name: 'Ellis' }, { timeout: 10_000 });
  fireEvent.click(screen.getByRole('tab', { name: 'Tools' }));
}
function toolSwitch(name: string) {
  return screen.getByRole('switch', { name: `Use ${name}` });
}
function savedPayload() {
  return mocks.api.request.mock.calls
    .filter(([request]) => request.path === 'ai/aiEmployees:update')
    .at(-1)?.[0].json;
}
async function save() {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument(),
  );
}
function permission(name: string, value: string) {
  return screen.getByRole('button', {
    name: `Permission for ${name}: ${value}`,
  });
}

describe('employee Tools selection', () => {
  it('shows a flat union of every scope/source with title, name, description and real switches, without add/remove/groups', async () => {
    await renderTools();
    const list = screen.getByRole('list', { name: 'Tools' });
    expect(
      within(list)
        .getAllByRole('switch')
        .map((control) => control.getAttribute('aria-label')),
    ).toEqual([
      'Use aiEmployeeWorkflowTaskOutput',
      'Use Custom tool',
      'Use Default custom',
      'Use disabledSkillTool',
      'Use General tool',
      'Use getSkill',
      'Use knowledge-base-retrieve',
      'Use MCP search',
      'Use missing',
      'Use missingSkillTool',
      'Use Skill tool',
      'Use Specified tool',
      'Use subAgentWebSearch',
      'Use unscoped',
    ]);
    expect(list).toHaveClass('divide-y', 'divide-border');
    expect(within(list).getAllByRole('listitem')).toHaveLength(
      catalog.length + 2,
    );
    for (const control of within(list).getAllByRole('switch')) {
      expect(control).toHaveAttribute('data-slot', 'switch');
      expect(control.closest('details')).toBeNull();
    }
    expect(screen.queryByText('General description')).not.toBeInTheDocument();
    expect(
      screen.getByText('General introduction').closest('.line-clamp-2'),
    ).toHaveAttribute('title', 'General introduction');
    for (const row of within(list).getAllByRole('listitem'))
      expect(row).toHaveClass('min-h-32');
    expect(screen.getByText('general')).toBeVisible();
    expect(toolSwitch('MCP search')).toBeChecked();
    expect(toolSwitch('unscoped')).not.toBeChecked();
    expect(
      screen.queryByRole('button', { name: /Add tool|Remove/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('General tools')).not.toBeInTheDocument();
    expect(screen.queryByText('Custom tools')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
  });

  it.each([undefined, null])(
    'snapshots legacy %s eligibility including optional system tools and tools of effective skills, preserving unknown names',
    async (enabledTools) => {
      if (enabledTools === null) employee.skillSettings!.enabledTools = null;
      await renderTools();
      for (const name of [
        'General tool',
        'MCP search',
        'Specified tool',
        'Custom tool',
        'Default custom',
        'Skill tool',
        'getSkill',
        'subAgentWebSearch',
        'knowledge-base-retrieve',
        'missing',
        'missingSkillTool',
      ])
        expect(toolSwitch(name)).toBeChecked();
      expect(toolSwitch('disabledSkillTool')).not.toBeChecked();
      expect(toolSwitch('aiEmployeeWorkflowTaskOutput')).not.toBeChecked();
      const originalSettings = structuredClone(employee.skillSettings);
      fireEvent.click(toolSwitch('General tool'));
      await save();
      expect(savedPayload().skillSettings.enabledTools).toEqual(
        expect.arrayContaining([
          'mcp',
          'specified',
          'custom',
          'customDefault',
          'skillTool',
          'getSkill',
          'subAgentWebSearch',
          'knowledge-base-retrieve',
          'missing',
          'missingSkillTool',
        ]),
      );
      expect(savedPayload().skillSettings.enabledTools).not.toContain(
        'general',
      );
      expect(savedPayload().skillSettings.tools).toEqual(
        originalSettings!.tools,
      );
      expect(savedPayload().skillSettings.skills).toEqual(
        originalSettings!.skills,
      );
      expect(savedPayload().skillSettings).not.toHaveProperty('enabledSkills');
      expect(toolSwitch('General tool')).not.toBeChecked();
    },
  );

  it('uses effective skill overrides rather than legacy configured skills', async () => {
    employee.skillSettings!.enabledSkills = ['disabledSkill'];
    await renderTools();
    expect(toolSwitch('Skill tool')).not.toBeChecked();
    expect(toolSwitch('Default custom')).not.toBeChecked();
    expect(toolSwitch('disabledSkillTool')).toBeChecked();
    fireEvent.click(toolSwitch('General tool'));
    await save();
    expect(savedPayload().skillSettings.enabledSkills).toEqual([
      'disabledSkill',
    ]);
  });

  it('retains editable custom permission controls, preserves permissions while off, and restores them when reenabled', async () => {
    await renderTools();
    expect(permission('Custom tool', 'Ask')).not.toBeDisabled();
    fireEvent.click(permission('Custom tool', 'Ask'));
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Allow' }),
    );
    expect(permission('Custom tool', 'Allow')).not.toBeDisabled();
    fireEvent.click(toolSwitch('Custom tool'));
    expect(permission('Custom tool', 'Allow')).toBeDisabled();
    await save();
    expect(savedPayload().skillSettings.tools).toContainEqual({
      name: 'custom',
      autoCall: true,
      preserved: 'yes',
    });
    expect(savedPayload().skillSettings.enabledTools).not.toContain('custom');
    fireEvent.click(toolSwitch('Custom tool'));
    expect(permission('Custom tool', 'Allow')).not.toBeDisabled();
    await save();
    expect(savedPayload().skillSettings.enabledTools).toContain('custom');
    expect(savedPayload().skillSettings.tools).toContainEqual({
      name: 'custom',
      autoCall: true,
      preserved: 'yes',
    });
  });

  it('uses registered CUSTOM defaults unless a saved setting exists, and keeps registered GENERAL/SPECIFIED permission read-only and truthful', async () => {
    await renderTools();
    expect(permission('Default custom', 'Allow')).not.toBeDisabled();
    expect(permission('Custom tool', 'Ask')).not.toBeDisabled();
    expect(
      screen.getByLabelText('Permission for General tool: Allow'),
    ).toBeVisible();
    expect(
      screen.getByLabelText('Permission for Specified tool: Allow'),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', {
        name: 'Permission for Specified tool: Allow',
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(permission('Default custom', 'Allow'));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Ask' }));
    await save();
    expect(savedPayload().skillSettings.tools).toContainEqual({
      name: 'customDefault',
      autoCall: false,
    });
    expect(savedPayload().skillSettings).not.toHaveProperty('enabledTools');
  });

  it('honors explicit empty selection, supports all-off, and resets without dirtying unrelated settings', async () => {
    employee.skillSettings!.enabledTools = [];
    await renderTools();
    for (const control of within(
      screen.getByRole('list', { name: 'Tools' }),
    ).getAllByRole('switch'))
      expect(control).not.toBeChecked();
    expect(permission('Custom tool', 'Ask')).toBeDisabled();
    fireEvent.click(toolSwitch('Custom tool'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(toolSwitch('Custom tool')).not.toBeChecked();
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
    fireEvent.click(toolSwitch('Custom tool'));
    await save();
    fireEvent.click(toolSwitch('Custom tool'));
    await save();
    expect(savedPayload().skillSettings.enabledTools).toEqual([]);
    expect(savedPayload().skillSettings.tools).toContainEqual({
      name: 'custom',
      autoCall: false,
      preserved: 'yes',
    });
  });

  it('keeps unknown overrides visible and preserves them when another row changes', async () => {
    employee.skillSettings!.enabledTools = ['unknown-override'];
    await renderTools();
    expect(toolSwitch('unknown-override')).toBeChecked();
    expect(toolSwitch('missing')).not.toBeChecked();
    fireEvent.click(toolSwitch('Specified tool'));
    await save();
    expect(savedPayload().skillSettings.enabledTools).toEqual([
      'unknown-override',
      'specified',
    ]);
    fireEvent.click(toolSwitch('unknown-override'));
    await save();
    expect(savedPayload().skillSettings.enabledTools).toEqual(['specified']);
  });

  it.each(
    [undefined, null, [], ['unknown']].map((enabledTools) => ({
      enabledTools,
    })),
  )(
    'preserves override $enabledTools on unrelated save and restores it on cancel',
    async ({ enabledTools }) => {
      if (enabledTools !== undefined)
        employee.skillSettings!.enabledTools = enabledTools;
      await renderTools();
      fireEvent.click(toolSwitch('General tool'));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('switch', { name: 'Enabled' }));
      await save();
      if (enabledTools === undefined)
        expect(savedPayload().skillSettings).not.toHaveProperty('enabledTools');
      else
        expect(savedPayload().skillSettings.enabledTools).toEqual(enabledTools);
    },
  );

  it.each(
    [undefined, null, [], ['unknown']].map((enabledTools) => ({
      enabledTools,
    })),
  )(
    'does not drop override $enabledTools or permissions on failure and retries without resetting a dirty draft',
    async ({ enabledTools }) => {
      if (enabledTools !== undefined)
        employee.skillSettings!.enabledTools = enabledTools;
      loadCatalog = async () => {
        throw new Error('Catalog failed');
      };
      await renderTools();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        enUS.employeeTools.error,
      );
      expect(toolSwitch('missing')).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(toolSwitch('missing'));
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('switch', { name: 'Enabled' }));
      await save();
      if (enabledTools === undefined)
        expect(savedPayload().skillSettings).not.toHaveProperty('enabledTools');
      else
        expect(savedPayload().skillSettings.enabledTools).toEqual(enabledTools);
      expect(savedPayload().skillSettings.tools).toContainEqual({
        name: 'custom',
        autoCall: false,
        preserved: 'yes',
      });
      let resolveCatalog!: (items: typeof catalog) => void;
      loadCatalog = () =>
        new Promise((resolve) => {
          resolveCatalog = resolve;
        });
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(screen.getByRole('status')).toHaveTextContent(
        enUS.employeeTools.loading,
      );
      expect(toolSwitch('missing')).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(screen.getByRole('tab', { name: 'Role settings' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Role settings' }), {
        target: { value: 'Keep this draft' },
      });
      await act(async () => resolveCatalog(catalog));
      expect(
        screen.getByRole('textbox', { name: 'Role settings' }),
      ).toHaveValue('Keep this draft');
      fireEvent.click(screen.getByRole('tab', { name: 'Tools' }));
      expect(toolSwitch('General tool')).toHaveAttribute(
        'aria-checked',
        String(enabledTools == null),
      );
      expect(toolSwitch('missing')).not.toHaveAttribute(
        'aria-disabled',
        'true',
      );
      expect(
        mocks.api.request.mock.calls.filter(
          ([request]) => request.path === 'ai/aiEmployees:get',
        ),
      ).toHaveLength(1);
    },
  );

  it('waits for skill metadata before allowing an eligibility snapshot and retries failed skill metadata in place', async () => {
    loadSkills = async () => {
      throw new Error('Skills unavailable');
    };
    await renderTools();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      enUS.employeeTools.error,
    );
    expect(toolSwitch('General tool')).toHaveAttribute('aria-disabled', 'true');
    expect(permission('Custom tool', 'Ask')).toBeDisabled();
    let resolveSkills!: (items: typeof skills) => void;
    loadSkills = () =>
      new Promise((resolve) => {
        resolveSkills = resolve;
      });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(toolSwitch('General tool')).toHaveAttribute('aria-disabled', 'true');
    await act(async () => resolveSkills(skills));
    expect(toolSwitch('Skill tool')).toBeChecked();
    expect(toolSwitch('General tool')).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
  });

  it('localizes permission hints and accessible names', () => {
    expect(enUS.employeeTools.use).toBe('Use {{name}}');
    expect(zhCN.employeeTools.use).toBe('使用{{name}}');
    for (const key of Object.keys(enUS.employeeTools) as Array<
      keyof typeof enUS.employeeTools
    >)
      expect(zhCN.employeeTools[key]).toBeTruthy();
  });
});
