import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { KnowledgeDirectorySource } from '@nocobase/app-plugin-knowledge/client/pages';
import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { KnowledgeIndexingDialogProps } from '@nocobase/app-plugin-knowledge/client/pages';
import { beforeEach, expect, it, vi } from 'vitest';
import KnowledgeDirectoryPage from '../../client/pages/knowledge/index.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const host = vi.hoisted(() => ({
  api: { request: vi.fn() },
  directory: undefined as KnowledgeDirectorySource | undefined,
  canRead: true,
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => host.api,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: host.canRead, isPending: false, error: null }),
}));
// Tests the application adapter contract; the unchanged directory UI belongs to the plugin's tests.
vi.mock('@nocobase/app-plugin-knowledge/client/pages', () => ({
  KnowledgeView: ({
    directory,
    titleActions,
  }: {
    directory: KnowledgeDirectorySource;
    titleActions: ReactNode;
  }) => {
    host.directory = directory;
    return <header>{titleActions}</header>;
  },
  KnowledgeIndexingDialog: ({
    open,
    onOpenChange,
  }: KnowledgeIndexingDialogProps) =>
    open ? (
      <div role='dialog'>
        <button onClick={() => onOpenChange(false)}>
          Close indexing settings
        </button>
      </div>
    ) : null,
}));

const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/app-template-examples',
    resources: {
      'en-US': () => Promise.resolve({ default: enUS }),
      'zh-CN': () => Promise.resolve({ default: zhCN }),
    },
  },
});

beforeEach(() => {
  host.api.request.mockReset();
  host.directory = undefined;
  host.canRead = true;
});

it.each(['en-US', 'zh-CN'])(
  'connects empty spaces and global search with localized names in %s',
  async (locale) => {
    await runtime.changeLanguage(locale);
    render(
      <MemoryRouter initialEntries={['/knowledge']}>
        <TestI18nProvider runtime={runtime}>
          <KnowledgeDirectoryPage />
        </TestI18nProvider>
      </MemoryRouter>,
    );
    const directory = host.directory!;
    const signal = new AbortController().signal;
    const scopes = ['default', 'sales', 'engineering'];
    host.api.request.mockResolvedValueOnce({
      data: scopes.map((scope) => ({
        space: {
          scope,
          scopeId: '',
          id: null,
          title: scope,
          inherited: false,
          access: { read: true, propose: false, edit: false, manage: false },
        },
        documents: 0,
        archivedDocuments: 0,
      })),
    });
    const spaces = await directory.summaries(signal);
    expect(host.api.request).toHaveBeenLastCalledWith({
      path: 'knowledgeDirectory',
      signal,
    });
    expect(spaces.map(({ space }) => space.title)).toEqual(
      locale === 'zh-CN'
        ? ['默认知识库', '销售知识库', '研发知识库']
        : [
            'Default knowledge base',
            'Sales knowledge base',
            'Engineering knowledge base',
          ],
    );
    expect(
      spaces.every(
        ({ space, documents }) => space.id === null && documents === 0,
      ),
    ).toBe(true);
    expect(directory.sharedScope).toBe('default');
    expect(directory.sharedLabel).toBe(
      locale === 'zh-CN' ? '默认知识库' : 'Default knowledge base',
    );
    host.api.request.mockResolvedValueOnce({ data: [] });
    expect(await directory.search('sales', signal)).toEqual([]);
    expect(host.api.request).toHaveBeenLastCalledWith({
      path: 'knowledgeDirectory/search',
      query: { q: 'sales' },
      signal,
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    const entry = screen.getByRole('button', {
      name: locale === 'zh-CN' ? '知识库索引' : 'Knowledge indexing',
    });
    expect(entry.querySelector('svg')).toHaveClass('lucide-settings');
    await userEvent.click(entry);
    expect(screen.getByRole('dialog')).toBeTruthy();
    await userEvent.click(
      screen.getByRole('button', { name: 'Close indexing settings' }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  },
);

it('omits the application-owned settings action without indexing read permission', async () => {
  host.canRead = false;
  await runtime.changeLanguage('en-US');
  render(
    <MemoryRouter>
      <TestI18nProvider runtime={runtime}>
        <KnowledgeDirectoryPage />
      </TestI18nProvider>
    </MemoryRouter>,
  );
  expect(
    screen.queryByRole('button', { name: 'Knowledge indexing' }),
  ).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
});
