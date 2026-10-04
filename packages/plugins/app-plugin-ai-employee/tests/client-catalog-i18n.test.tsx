// @vitest-environment jsdom
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCatalogDisplay } from '../client/catalog-display.js';
import { SkillToolBadges } from '../client/components/skill-tool-badges.js';
import locales from '../client/locales/index.js';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createCatalogTestRouter } from './catalog-test-router.js';
import { createEmployeeTestRouter } from './employee-test-router.js';
import MCPPage from '../client/pages/mcp-page.js';
import MCPToolsPage from '../client/pages/mcp-services/tools.js';
import type { ManagedSkillDetail } from '../client/skills-management-service.js';
import type { ManagedToolDetail } from '../client/tools-management-service.js';
import packageMetadata from '../package.json' with { type: 'json' };

const mocks = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn(), close: vi.fn() },
}));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => mocks.api,
  useService: () => mocks.api,
  useToaster: () => mocks.toaster,
}));

const namespace = '@test/catalog-owner';
const sourceTitle = 'Read records: v2.0';
const sourceAbout = 'Browse **records**. Safely: yes.';
const sourceSkillTitle = 'Analyze records: v2.0';
const sourceDescription = 'Analyze data. Then: summarize.';
const tool: ManagedToolDetail = {
  name: 'record-tool',
  title: sourceTitle,
  about: sourceAbout,
  description: 'Model-facing description',
  inputSchema: { type: 'object', description: 'Model-facing schema' },
  i18n: { namespace },
  scope: 'GENERAL',
  source: 'builtin',
};
const skill: ManagedSkillDetail = {
  name: 'record-skill',
  title: sourceSkillTitle,
  description: sourceDescription,
  content: '# Model-facing instructions',
  i18n: { namespace },
  tools: [{ ...tool, available: true }],
};

async function createRuntime() {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN', 'sv-SE'],
    applicationNamespace: '@test/app',
  });
  runtime.registerNamespace(packageMetadata.name, locales);
  runtime.registerNamespace('@test/app', {
    'en-US': async () => ({
      'Not translated: v1.2': 'Wrong fallback namespace',
    }),
    'zh-CN': async () => ({
      [sourceTitle]: '应用自己的工具',
      'Read {{name}}.\nThen: summarize.': '读取 {{name}}。\n然后总结。',
    }),
  });
  runtime.registerNamespace(namespace, {
    'en-US': async () => ({
      [sourceTitle]: 'Zebra 10',
      [sourceSkillTitle]: 'Zebra 10',
    }),
    'zh-CN': async () => ({
      [sourceTitle]: '目录 2',
      [sourceAbout]: '浏览 **记录**。安全使用。',
      [sourceSkillTitle]: '技能 2',
      [sourceDescription]: '分析数据并总结。',
      'Model-facing description': 'DO NOT TRANSLATE MODEL DESCRIPTION',
      '# Model-facing instructions': 'DO NOT TRANSLATE INSTRUCTIONS',
    }),
    'sv-SE': async () => ({}),
  });
  runtime.registerNamespace('@test/other-owner', {
    'en-US': async () => ({ [sourceTitle]: 'Other owner' }),
    'zh-CN': async () => ({ [sourceTitle]: '另一命名空间' }),
  });
  await runtime.init('en-US');
  return runtime;
}

async function mount(page: ReactNode) {
  const runtime = await createRuntime();
  const view = render(<I18nProvider runtime={runtime}>{page}</I18nProvider>);
  return { runtime, ...view };
}
async function changeLanguage(runtime: I18nRuntime, language: string) {
  await act(async () => {
    await runtime.changeLanguage(language);
  });
}

beforeEach(() => {
  mocks.api.request.mockReset();
  mocks.toaster.show.mockReset();
});

describe('client-only catalog translations', () => {
  it('uses literal source keys with explicit ownership, fallback and independent display fields', async () => {
    const runtime = await createRuntime();
    const { result } = renderHook(useCatalogDisplay, {
      wrapper: ({ children }) => (
        <I18nProvider runtime={runtime}>{children}</I18nProvider>
      ),
    });
    const original = structuredClone({ tool, skill });
    expect(result.current.toolTitle(tool)).toBe('Zebra 10');
    expect(result.current.toolTitle({ ...tool, i18n: undefined })).toBe(
      sourceTitle,
    );
    expect(result.current.toolTitle({ ...tool, i18n: { namespace: '' } })).toBe(
      sourceTitle,
    );
    expect(
      result.current.toolTitle({
        ...tool,
        i18n: { namespace: '@test/missing-owner' },
      }),
    ).toBe(sourceTitle);
    expect(
      result.current.toolTitle({
        ...tool,
        i18n: { namespace: '@test/other-owner' },
      }),
    ).toBe('Other owner');
    expect(
      result.current.toolTitle({ ...tool, title: 'Not translated: v1.2' }),
    ).toBe('Not translated: v1.2');
    expect(result.current.toolTitle({ ...tool, title: ' ' })).toBe(tool.name);
    expect(result.current.toolAbout(tool)).toBe(sourceAbout);
    await changeLanguage(runtime, 'zh-CN');
    expect(result.current.toolTitle(tool)).toBe('目录 2');
    expect(
      result.current.toolTitle({ ...tool, i18n: { namespace: '@test/app' } }),
    ).toBe('应用自己的工具');
    expect(
      result.current.skillDescription({
        ...skill,
        description: 'Read {{name}}.\nThen: summarize.',
        i18n: { namespace: '@test/app' },
      }),
    ).toBe('读取 {{name}}。\n然后总结。');
    expect(result.current.toolAbout(tool)).toBe('浏览 **记录**。安全使用。');
    expect(result.current.skillTitle(skill)).toBe('技能 2');
    expect(result.current.skillDescription(skill)).toBe('分析数据并总结。');
    expect(result.current.skillDescription({ ...skill, i18n: undefined })).toBe(
      sourceDescription,
    );
    expect({ tool, skill }).toEqual(original);
  });

  it('compares current-locale titles numerically and uses stable names for equal titles', async () => {
    const runtime = await createRuntime();
    const { result } = renderHook(useCatalogDisplay, {
      wrapper: ({ children }) => (
        <I18nProvider runtime={runtime}>{children}</I18nProvider>
      ),
    });
    expect(
      result.current.compareTitles('Tool 2', 'Tool 10', 'z', 'a'),
    ).toBeLessThan(0);
    expect(result.current.compareTitles('SAME', 'same', 'a', 'z')).toBeLessThan(
      0,
    );
    expect(
      result.current.compareTitles('same', 'SAME', 'z', 'a'),
    ).toBeGreaterThan(0);
    expect(result.current.compareTitles('ä', 'z', 'z', 'a')).toBeLessThan(0);
    await changeLanguage(runtime, 'sv-SE');
    expect(result.current.compareTitles('ä', 'z', 'z', 'a')).toBeGreaterThan(0);
  });

  it('updates tool search, sorted titles and an already-open drawer without refetching or modifying model data', async () => {
    const rows = [
      tool,
      { ...tool, name: 'literal', title: 'Middle', about: '', i18n: undefined },
    ];
    const original = structuredClone(rows);
    mocks.api.request.mockImplementation(async ({ path }: { path: string }) =>
      path === 'aiEmployee/tools' ? { data: rows } : { data: tool },
    );
    const { runtime } = await mount(
      <RouterProvider router={createCatalogTestRouter('tools')} />,
    );
    const list = await screen.findByRole('list');
    const titles = () =>
      within(list)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label'));
    expect(titles()).toEqual(['Middle', 'Zebra 10']);
    const search = screen.getByRole('searchbox');
    fireEvent.change(search, { target: { value: '浏览' } });
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    await changeLanguage(runtime, 'zh-CN');
    expect(screen.getByRole('button', { name: '目录 2' })).toBeVisible();
    fireEvent.change(search, { target: { value: '' } });
    expect(
      within(screen.getByRole('list'))
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['目录 2', 'Middle']);
    fireEvent.click(screen.getByRole('button', { name: '目录 2' }));
    const dialog = screen.getByRole('dialog');
    expect(
      await within(dialog).findByText('Model-facing description'),
    ).toBeVisible();
    expect(within(dialog).getByText('记录').tagName).toBe('STRONG');
    expect(dialog).toHaveTextContent('Model-facing schema');
    await changeLanguage(runtime, 'en-US');
    expect(
      within(dialog).getByRole('heading', { name: 'Zebra 10' }),
    ).toBeVisible();
    expect(within(dialog).getByText('records').tagName).toBe('STRONG');
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
    expect(rows).toEqual(original);
  });

  it('translates skill cards, descriptions, associated badges and opened details but not instructions', async () => {
    const rows = [
      skill,
      {
        ...skill,
        name: 'literal',
        title: 'Middle',
        description: '',
        i18n: undefined,
        tools: [],
      },
    ];
    const original = structuredClone(rows);
    mocks.api.request.mockImplementation(async ({ path }: { path: string }) =>
      path === 'aiEmployee/skills' ? { data: rows } : { data: skill },
    );
    const { runtime } = await mount(
      <RouterProvider router={createCatalogTestRouter('skills')} />,
    );
    const list = await screen.findByRole('list');
    expect(
      within(list)
        .getAllByRole('heading')
        .map((heading) => heading.textContent),
    ).toEqual(['Middle', 'Zebra 10']);
    const search = screen.getByRole('searchbox');
    fireEvent.change(search, { target: { value: '目录 2' } });
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    await changeLanguage(runtime, 'zh-CN');
    expect(screen.getByRole('button', { name: '技能 2' })).toBeVisible();
    expect(screen.getByTitle('目录 2')).toBeVisible();
    expect(screen.getByTitle('分析数据并总结。')).toBeVisible();
    fireEvent.change(search, { target: { value: '' } });
    expect(
      within(screen.getByRole('list'))
        .getAllByRole('heading')
        .map((heading) => heading.textContent),
    ).toEqual(['技能 2', 'Middle']);
    fireEvent.click(screen.getByRole('button', { name: '技能 2' }));
    const dialog = screen.getByRole('dialog');
    expect(
      await within(dialog).findByRole('heading', {
        name: 'Model-facing instructions',
      }),
    ).toBeVisible();
    expect(dialog).toHaveTextContent('分析数据并总结。');
    fireEvent.click(within(dialog).getAllByRole('tab')[1]);
    expect(await within(dialog).findByTitle('目录 2')).toBeVisible();
    expect(within(dialog).getByText('浏览 记录。安全使用。')).toBeVisible();
    await changeLanguage(runtime, 'en-US');
    expect(
      within(dialog).getByRole('heading', { name: 'Zebra 10' }),
    ).toBeVisible();
    expect(within(dialog).getByTitle('Zebra 10')).toBeVisible();
    expect(dialog).toHaveTextContent(sourceDescription);
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
    expect(rows).toEqual(original);
  });

  it('updates employee selector text, order and accessible names while saving only identifiers', async () => {
    const employee = {
      username: 'atlas',
      nickname: 'Atlas',
      enabled: true,
      skillSettings: {
        skills: [],
        tools: [],
        enabledSkills: [],
        enabledTools: [],
      },
    };
    const rawTools = [
      {
        name: tool.name,
        title: tool.title,
        description: tool.description,
        about: tool.about,
        i18n: tool.i18n,
      },
      { name: 'literal-tool', title: 'Middle', description: '', about: '' },
    ];
    const rawSkills = [
      {
        name: skill.name,
        title: skill.title,
        description: skill.description,
        about: '',
        i18n: skill.i18n,
      },
      { name: 'literal-skill', title: 'Middle', description: '', about: '' },
    ];
    const original = structuredClone({ rawTools, rawSkills });
    mocks.api.request.mockImplementation(
      async ({ path, json }: { path: string; json?: object }) => {
        if (path === 'aiEmployees') return { data: [employee] };
        if (path === 'aiEmployees/atlas')
          return { data: json ? { ...employee, ...json } : employee };
        if (path === 'aiEmployee/tools') return { data: rawTools };
        if (path === 'aiEmployee/skills') return { data: rawSkills };
        return { data: [] };
      },
    );
    const { runtime } = await mount(
      <RouterProvider router={createEmployeeTestRouter()} />,
    );
    await screen.findByRole('heading', { name: 'Atlas' });
    fireEvent.click(screen.getByRole('tab', { name: 'Skills' }));
    const selectorNames = () =>
      within(screen.getByRole('list'))
        .getAllByRole('switch')
        .map((control) => control.getAttribute('aria-label'));
    expect(selectorNames()).toEqual(['Use Middle', 'Use Zebra 10']);
    await changeLanguage(runtime, 'zh-CN');
    expect(selectorNames()[0]).toContain('技能 2');
    expect(screen.getByText('分析数据并总结。')).toBeVisible();
    fireEvent.click(within(screen.getByRole('list')).getAllByRole('switch')[0]);
    // Tab positions are stable even when their labels change language.
    fireEvent.click(screen.getAllByRole('tab')[4]);
    expect(selectorNames()[0]).toContain('目录 2');
    expect(screen.getByText('浏览 记录。安全使用。')).toBeVisible();
    fireEvent.click(within(screen.getByRole('list')).getAllByRole('switch')[0]);
    await changeLanguage(runtime, 'en-US');
    expect(selectorNames()).toEqual(['Use Middle', 'Use Zebra 10']);
    expect(screen.getByTitle('Zebra 10')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mocks.toaster.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      ),
    );
    const update = mocks.api.request.mock.calls.find(
      ([request]) => request.path === 'aiEmployees/atlas' && request.json,
    )?.[0];
    expect(update.json.skillSettings).toMatchObject({
      enabledSkills: [skill.name],
      enabledTools: [tool.name],
    });
    expect(JSON.stringify(update.json)).not.toContain('Zebra 10');
    expect({ rawTools, rawSkills }).toEqual(original);
  });

  it('updates tool titles and ordering in an open MCP drawer while retaining model descriptions', async () => {
    const entries = [
      { ...tool, serverName: 'server', permission: 'ASK' },
      {
        ...tool,
        name: 'literal',
        title: 'Middle',
        i18n: undefined,
        serverName: 'server',
        permission: 'ASK',
      },
    ];
    const original = structuredClone(entries);
    mocks.api.request.mockImplementation(async ({ path }: { path: string }) =>
      path === 'aiEmployee/mcpServers/tools'
        ? { data: { server: entries } }
        : {
            data: [
              {
                name: 'server',
                title: 'Server',
                enabled: true,
                transport: 'http',
              },
            ],
          },
    );
    const router = createMemoryRouter(
      [
        {
          path: '/settings/ai/mcp-services',
          Component: MCPPage,
          children: [{ path: ':serverName/tools', Component: MCPToolsPage }],
        },
      ],
      { initialEntries: ['/settings/ai/mcp-services'] },
    );
    const { runtime } = await mount(<RouterProvider router={router} />);
    fireEvent.click(await screen.findByRole('button', { name: 'View' }));
    const dialog = screen.getByRole('dialog');
    const rows = () => within(dialog).getAllByRole('listitem');
    expect(rows()[0]).toHaveTextContent('Middle');
    await changeLanguage(runtime, 'zh-CN');
    expect(rows()[0]).toHaveTextContent('目录 2');
    expect(rows()[0]).toHaveTextContent(tool.description);
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
    expect(entries).toEqual(original);
  });

  it('remeasures translated badges and updates overflow tooltip labels after a language switch', async () => {
    const bounds = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const width = this.classList.contains('relative')
          ? 100
          : this.textContent?.startsWith('+')
            ? 20
            : this.textContent === '目录 2'
              ? 120
              : 40;
        return {
          width,
          height: 20,
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: width,
          bottom: 20,
          toJSON: () => ({}),
        };
      });
    try {
      const { runtime, container } = await mount(
        <SkillToolBadges tools={[{ ...tool, available: true }]} />,
      );
      expect(screen.getByTitle('Zebra 10')).toBeVisible();
      await changeLanguage(runtime, 'zh-CN');
      expect(screen.getByTitle('目录 2')).toHaveTextContent('+1');
      expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent(
        '目录 2',
      );
      await changeLanguage(runtime, 'en-US');
      expect(screen.getByTitle('Zebra 10')).toHaveTextContent('Zebra 10');
    } finally {
      bounds.mockRestore();
    }
  });
});
