// @vitest-environment jsdom
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import locales from '../client/locales/index.js';
import SkillDetailPage from '../client/pages/skills/detail.js';
import SkillInstructionsPage from '../client/pages/skills/instructions.js';
import SkillToolsPage from '../client/pages/skills/tools.js';
import ToolDetailPage from '../client/pages/tools/detail.js';
import type { ManagedSkillDetail } from '../client/skills-management-service.js';
import type { ManagedToolDetail } from '../client/tools-management-service.js';
import packageMetadata from '../package.json' with { type: 'json' };
import { createCatalogTestRouter } from './catalog-test-router.js';

const mocks = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => mocks.api,
}));

const skill: ManagedSkillDetail = {
  name: 'analysis',
  title: 'Analysis',
  description: 'Review records',
  content: '# Analysis instructions',
  tools: [],
};
const tool: ManagedToolDetail = {
  name: 'query',
  title: 'Query',
  description: 'Read records',
  about: '# Query documentation',
  inputSchema: {},
  scope: '',
  source: '',
};
type Request = { path: string; signal: AbortSignal };

/** `aiEmployee/skills` and `aiEmployee/tools` list; `aiEmployee/<catalog>/<name>` reads one. */
const isList = (path: string): boolean =>
  /^aiEmployee\/(skills|tools)$/.test(path);
const detailName = (path: string): string =>
  decodeURIComponent(path.split('/')[2] ?? '');

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

async function mount(
  catalog: 'skills' | 'tools',
  entries: string[],
  locale = 'en-US',
) {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: '@test/app',
  });
  runtime.registerNamespace(packageMetadata.name, locales);
  await runtime.init(locale);
  const router = createCatalogTestRouter(catalog, entries);
  const view = render(
    <I18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </I18nProvider>,
  );
  return { ...view, router };
}

function detailRequests(): Request[] {
  return mocks.api.request.mock.calls
    .map(([request]: [Request]) => request)
    .filter((request) => !isList(request.path));
}

beforeEach(() => {
  mocks.api.request
    .mockReset()
    .mockImplementation(async ({ path }: Request) => {
      if (isList(path)) return { data: [] };
      return {
        data: path.includes('skills')
          ? { ...skill, name: detailName(path) || skill.name }
          : { ...tool, name: detailName(path) || tool.name },
      };
    });
});

describe('catalog child routes', () => {
  it('loads the agreed real child page modules from the production route declarations', async () => {
    const { createAISettings } = await import('../client/ai-settings.js');
    const children = createAISettings().children;
    const skills = children.find((route) => route.name === 'aiSkills');
    const tools = children.find((route) => route.name === 'aiTools');
    const skillDetail = skills?.children?.[0];
    const toolDetail = tools?.children?.[0];
    expect(skillDetail?.path).toBe(':skillName');
    expect(toolDetail?.path).toBe(':toolName');
    if (
      !skillDetail ||
      !('componentLoader' in skillDetail) ||
      !toolDetail ||
      !('componentLoader' in toolDetail)
    )
      throw new Error('Missing catalog detail pages');
    expect((await skillDetail.componentLoader()).default).toBe(SkillDetailPage);
    expect((await toolDetail.componentLoader()).default).toBe(ToolDetailPage);
    const tabs = skillDetail.children ?? [];
    expect(tabs.map((tab) => tab.path)).toEqual(['instructions', 'tools']);
    for (const [index, component] of [
      SkillInstructionsPage,
      SkillToolsPage,
    ].entries()) {
      const tab = tabs[index];
      if (!tab || !('componentLoader' in tab))
        throw new Error('Missing skill tab');
      expect((await tab.componentLoader()).default).toBe(component);
      expect(tab).not.toHaveProperty('navigation');
      expect(tab).not.toHaveProperty('breadcrumb');
    }
  });

  it.each(['skills', 'tools'] as const)(
    'loads a direct %s detail without a summary even when the directory fails',
    async (catalog) => {
      mocks.api.request.mockImplementation(async ({ path }: Request) => {
        if (isList(path)) throw new Error('Directory unavailable');
        return { data: catalog === 'skills' ? skill : tool };
      });
      const name = catalog === 'skills' ? skill.name : tool.name;
      const { router } = await mount(catalog, [
        `/settings/ai/${catalog}/${name}?filter=recent`,
      ]);
      const dialog = await screen.findByRole('dialog');
      expect(
        await within(dialog).findByRole('heading', {
          name:
            catalog === 'skills'
              ? 'Analysis instructions'
              : 'Query documentation',
        }),
      ).toBeVisible();
      expect(detailRequests()).toHaveLength(1);
      expect(detailName(detailRequests()[0].path)).toBe(name);
      expect(router.state.location.pathname).toBe(
        `/settings/ai/${catalog}/${name}${catalog === 'skills' ? '/instructions' : ''}`,
      );
      expect(router.state.location.search).toBe('?filter=recent');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
      await waitFor(() =>
        expect(router.state.location.pathname).toBe(`/settings/ai/${catalog}`),
      );
      expect(router.state.location.search).toBe('?filter=recent');
      expect(await screen.findByRole('alert')).toHaveTextContent(
        catalog === 'skills'
          ? 'Unable to load skills.'
          : 'Unable to load tools.',
      );
    },
  );

  it.each(['skills', 'tools'] as const)(
    'loads direct %s details while the directory is still pending',
    async (catalog) => {
      const pending = deferred<{ data: [] }>();
      mocks.api.request.mockImplementation(({ path }: Request) =>
        isList(path)
          ? pending.promise
          : Promise.resolve({ data: catalog === 'skills' ? skill : tool }),
      );
      const name = catalog === 'skills' ? skill.name : tool.name;
      const view = await mount(catalog, [
        `/settings/ai/${catalog}/${name}${catalog === 'skills' ? '/tools' : ''}`,
      ]);
      const dialog = await screen.findByRole('dialog');
      expect(
        await within(dialog).findByText(
          catalog === 'skills' ? 'No tools' : 'Query documentation',
        ),
      ).toBeVisible();
      expect(detailRequests()).toHaveLength(1);
      view.unmount();
      await act(async () => pending.resolve({ data: [] }));
    },
  );

  it('retains an explicit tools tab across reload, keyboard navigation and history without refetching details', async () => {
    const view = await mount('skills', [
      '/settings/ai/skills/analysis/tools?filter=recent',
    ]);
    const dialog = await screen.findByRole('dialog');
    const toolsTab = await within(dialog).findByRole('tab', {
      name: 'Tools (0)',
    });
    expect(toolsTab).toHaveAttribute('aria-selected', 'true');
    expect(
      within(dialog).getByRole('tabpanel', { name: 'Tools (0)' }),
    ).toBeVisible();
    act(() => toolsTab.focus());
    fireEvent.keyDown(toolsTab, { key: 'ArrowLeft' });
    await waitFor(() =>
      expect(view.router.state.location.pathname).toBe(
        '/settings/ai/skills/analysis/instructions',
      ),
    );
    expect(view.router.state.location.search).toBe('?filter=recent');
    expect(
      within(dialog).getByRole('tab', { name: 'Instructions' }),
    ).toHaveFocus();
    expect(
      await within(dialog).findByRole('heading', {
        name: 'Analysis instructions',
      }),
    ).toBeVisible();
    await act(async () => view.router.navigate(-1));
    expect(view.router.state.location.pathname).toBe(
      '/settings/ai/skills/analysis/tools',
    );
    expect(
      within(dialog).getByRole('tab', { name: 'Tools (0)' }),
    ).toHaveAttribute('aria-selected', 'true');
    await act(async () => view.router.navigate(1));
    expect(view.router.state.location.pathname).toBe(
      '/settings/ai/skills/analysis/instructions',
    );
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(detailRequests()).toHaveLength(1);
    view.unmount();
    const reloaded = await mount('skills', [
      '/settings/ai/skills/analysis/tools?filter=recent',
    ]);
    expect(
      await screen.findByRole('tabpanel', { name: 'Tools (0)' }),
    ).toBeVisible();
    expect(reloaded.router.state.location.pathname).toBe(
      '/settings/ai/skills/analysis/tools',
    );
  });

  it.each(['skills', 'tools'] as const)(
    'closes a directly loaded %s drawer to its parent instead of an unrelated history entry',
    async (catalog) => {
      const name = catalog === 'skills' ? skill.name : tool.name;
      const { router } = await mount(catalog, [
        '/outside',
        `/settings/ai/${catalog}/${name}?q=saved`,
      ]);
      const dialog = await screen.findByRole('dialog');
      await within(dialog).findByRole('heading', {
        name:
          catalog === 'skills'
            ? 'Analysis instructions'
            : 'Query documentation',
      });
      fireEvent.keyDown(dialog, { key: 'Escape' });
      await waitFor(() =>
        expect(router.state.location.pathname).toBe(`/settings/ai/${catalog}`),
      );
      expect(router.state.location.search).toBe('?q=saved');
      expect(router.state.historyAction).toBe('REPLACE');
      await act(async () => router.navigate(-1));
      expect(await screen.findByText('Outside catalog')).toBeVisible();
    },
  );

  it.each(['skills', 'tools'] as const)(
    'preserves the %s directory and search through child history and backdrop closing',
    async (catalog) => {
      const entry = catalog === 'skills' ? skill : tool;
      mocks.api.request.mockImplementation(async ({ path }: Request) =>
        isList(path) ? { data: [entry] } : { data: entry },
      );
      const { router } = await mount(catalog, [
        `/settings/ai/${catalog}?sort=name`,
      ]);
      const trigger = await screen.findByRole('button', { name: entry.title });
      const search = screen.getByRole('searchbox');
      fireEvent.change(search, { target: { value: entry.name } });
      fireEvent.click(
        catalog === 'skills' ? trigger.closest('[data-slot=card]')! : trigger,
      );
      const dialog = await screen.findByRole('dialog');
      await within(dialog).findByRole('heading', {
        name:
          catalog === 'skills'
            ? 'Analysis instructions'
            : 'Query documentation',
      });
      await act(async () => router.navigate(-1));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBe(search);
      expect(search).toHaveValue(entry.name);
      await act(async () => router.navigate(1));
      await screen.findByRole('dialog');
      const backdrop = document.querySelector('[data-slot=dialog-overlay]')!;
      fireEvent.mouseDown(backdrop);
      fireEvent.mouseUp(backdrop);
      fireEvent.click(backdrop);
      await waitFor(() =>
        expect(router.state.location.pathname).toBe(`/settings/ai/${catalog}`),
      );
      expect(router.state.location.search).toBe('?sort=name');
      await waitFor(() => expect(trigger).toHaveFocus());
      expect(
        mocks.api.request.mock.calls.filter(([request]: [Request]) =>
          isList(request.path),
        ),
      ).toHaveLength(1);
    },
  );

  it.each(['skills', 'tools'] as const)(
    'shows translated not-found %s state without fabricating details or redirecting away',
    async (catalog) => {
      mocks.api.request.mockImplementation(async ({ path }: Request) => {
        if (isList(path)) return { data: [] };
        throw Object.assign(new Error('Missing'), { status: 404 });
      });
      const url = `/settings/ai/${catalog}/missing${catalog === 'skills' ? '/tools' : ''}`;
      const { router } = await mount(catalog, [url], 'zh-CN');
      const dialog = await screen.findByRole('dialog');
      expect(
        await within(dialog).findByText(
          catalog === 'skills' ? '未找到技能。' : '未找到工具。',
        ),
      ).toBeVisible();
      expect(
        within(dialog).queryByRole('button', { name: '重试' }),
      ).not.toBeInTheDocument();
      expect(router.state.location.pathname).toBe(url);
      expect(within(dialog).queryByRole('tabpanel')).not.toBeInTheDocument();
      expect(
        within(dialog).getByRole('button', { name: '关闭' }),
      ).toBeVisible();
    },
  );

  it.each(['skills', 'tools'] as const)(
    'retries a failed direct %s detail without requiring any summary',
    async (catalog) => {
      let attempts = 0;
      mocks.api.request.mockImplementation(async ({ path }: Request) => {
        if (isList(path)) return { data: [] };
        if (++attempts === 1)
          throw Object.assign(new Error('Temporary failure'), { status: 503 });
        return { data: catalog === 'skills' ? skill : tool };
      });
      const name = catalog === 'skills' ? skill.name : tool.name;
      const { router } = await mount(catalog, [
        `/settings/ai/${catalog}/${name}?q=saved`,
      ]);
      const dialog = await screen.findByRole('dialog');
      const alert = await within(dialog).findByRole('alert');
      fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
      expect(
        await within(dialog).findByRole('heading', {
          name:
            catalog === 'skills'
              ? 'Analysis instructions'
              : 'Query documentation',
        }),
      ).toBeVisible();
      expect(attempts).toBe(2);
      expect(router.state.location.search).toBe('?q=saved');
    },
  );

  it.each(['skills', 'tools'] as const)(
    'aborts old %s detail requests on parameter navigation and ignores late completion',
    async (catalog) => {
      const previous = deferred<{
        data: ManagedSkillDetail | ManagedToolDetail;
      }>();
      const current = deferred<{
        data: ManagedSkillDetail | ManagedToolDetail;
      }>();
      mocks.api.request.mockImplementation(({ path }: Request) => {
        if (isList(path)) return Promise.resolve({ data: [] });
        return detailName(path) === 'first'
          ? previous.promise
          : current.promise;
      });
      const tab = catalog === 'skills' ? '/instructions' : '';
      const { router } = await mount(catalog, [
        `/settings/ai/${catalog}/first${tab}`,
      ]);
      await screen.findByRole('dialog');
      const signal = detailRequests()[0].signal;
      await act(async () =>
        router.navigate(`/settings/ai/${catalog}/second${tab}`),
      );
      expect(signal.aborted).toBe(true);
      const dialog = screen.getByRole('dialog');
      await act(async () =>
        previous.resolve({ data: catalog === 'skills' ? skill : tool }),
      );
      expect(within(dialog).getByRole('status')).toHaveTextContent(
        catalog === 'skills'
          ? 'Loading skill details…'
          : 'Loading tool details…',
      );
      expect(
        within(dialog).queryByRole('heading', {
          name: 'Analysis instructions',
        }),
      ).not.toBeInTheDocument();
      await act(async () =>
        current.resolve({
          data:
            catalog === 'skills'
              ? { ...skill, name: 'second', content: '# Current skill' }
              : { ...tool, name: 'second', about: '# Current tool' },
        }),
      );
      expect(
        within(dialog).getByRole('heading', {
          name: catalog === 'skills' ? 'Current skill' : 'Current tool',
        }),
      ).toBeVisible();
      expect(detailRequests()).toHaveLength(2);
    },
  );

  it.each(['skills', 'tools'] as const)(
    'decodes an encoded %s route identity before loading details',
    async (catalog) => {
      const name = 'name with spaces 雪';
      const { router } = await mount(catalog, [
        `/settings/ai/${catalog}/${encodeURIComponent(name)}${catalog === 'skills' ? '/tools' : ''}`,
      ]);
      const dialog = await screen.findByRole('dialog');
      await within(dialog).findByText(
        catalog === 'skills' ? 'No tools' : 'Query documentation',
      );
      expect(detailName(detailRequests()[0].path)).toBe(name);
      expect(router.state.location.pathname).toContain(
        encodeURIComponent(name),
      );
    },
  );
});
