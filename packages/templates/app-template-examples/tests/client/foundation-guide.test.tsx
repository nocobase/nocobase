import { renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, within, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import FoundationGuide from '../../client/pages/foundation-guide/index.js';
import {
  AllCatalog,
  KernelCatalog,
  PluginCatalog,
} from '../../client/pages/foundation-guide/catalog-view.js';
import DetailRoute from '../../client/pages/foundation-guide/detail.js';
import { enUS, zhCN } from '../../client/pages/foundation-guide/locales.js';
import {
  createPackageCatalog,
  packages,
} from '../../client/pages/foundation-guide/catalog.js';
import applicationManifest from '../../package.json';

const namespace = '@nocobase/foundation-guide-test';
async function render(route = '/foundation-guide', locale = 'en-US') {
  return renderWithApp(
    <Routes>
      <Route path='/foundation-guide' element={<FoundationGuide />}>
        <Route path='all' element={<AllCatalog />}>
          <Route path=':packageId' element={<DetailRoute />} />
        </Route>
        <Route path='kernel' element={<KernelCatalog />}>
          <Route path=':packageId' element={<DetailRoute />} />
        </Route>
        <Route path='plugins' element={<PluginCatalog />}>
          <Route path=':packageId' element={<DetailRoute />} />
        </Route>
      </Route>
    </Routes>,
    {
      route,
      locale,
      namespace,
      namespaces: {
        [namespace]: {
          'en-US': async () => ({ default: { foundationGuide: enUS } }),
          'zh-CN': async () => ({ default: { foundationGuide: zhCN } }),
        },
      },
    },
  );
}

afterEach(() => vi.restoreAllMocks());

function directoryIds(directory: HTMLElement) {
  return within(directory)
    .getAllByRole('link')
    .map((link) => link.getAttribute('href')?.split('/').at(-1));
}

describe('Foundation business guide', () => {
  it('defaults to the combined directory, sorted by plugin name and labelled by source', async () => {
    await render();
    const directory = await screen.findByRole('complementary');
    expect(directoryIds(directory)).toEqual(
      [...packages]
        .sort((a, b) => a.name.localeCompare(b.name, 'en'))
        .map((entry) => entry.id),
    );
    expect(
      within(directory).getByRole('link', { name: 'Business data Core' }),
    ).toBeInTheDocument();
    expect(
      within(directory).getByRole('link', {
        name: 'Files & attachments Plugin',
      }),
    ).toBeInTheDocument();
    expect(directory).not.toHaveTextContent('@nocobase/');
    expect(screen.getByRole('link', { name: /^All/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('preserves a business search across filters, related details and return', async () => {
    await render('/foundation-guide', 'zh-CN');
    const filters = await screen.findByRole('navigation', {
      name: '按来源筛选',
    });
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '附件' },
    });
    expect(
      within(screen.getByRole('complementary')).getByRole('link', {
        name: '文件与附件 插件',
      }),
    ).toBeInTheDocument();
    fireEvent.click(within(filters).getByRole('link', { name: /^内核/ }));
    await waitFor(() =>
      expect(
        within(filters).getByRole('link', { name: /^内核/ }),
      ).toHaveAttribute('aria-current', 'page'),
    );
    expect(screen.getByRole('searchbox')).toHaveValue('附件');
    expect(
      within(screen.getByRole('complementary')).getByRole('status'),
    ).toHaveTextContent('没有找到匹配项');
    fireEvent.click(within(filters).getByRole('link', { name: /^插件/ }));
    await waitFor(() =>
      expect(
        within(filters).getByRole('link', { name: /^插件/ }),
      ).toHaveAttribute('aria-current', 'page'),
    );
    expect(screen.getByRole('searchbox')).toHaveValue('附件');
    fireEvent.click(within(filters).getByRole('link', { name: /^全部/ }));
    await waitFor(() =>
      expect(
        within(filters).getByRole('link', { name: /^全部/ }),
      ).toHaveAttribute('aria-current', 'page'),
    );
    fireEvent.click(
      within(screen.getByRole('complementary')).getByRole('link', {
        name: '文件与附件 插件',
      }),
    );
    await screen.findByRole('heading', { name: '文件与附件' });
    fireEvent.click(
      within(screen.getByRole('article')).getByRole('link', {
        name: '业务数据',
      }),
    );
    await screen.findByRole('heading', { name: '业务数据' });
    expect(
      within(filters).getByRole('link', { name: /^全部/ }),
    ).toHaveAttribute('aria-current', 'page');
    fireEvent.click(
      within(screen.getByRole('article')).getByRole('link', {
        name: '返回目录',
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole('searchbox')).toHaveValue('附件'),
    );
    expect(
      within(screen.getByRole('complementary')).getByRole('link', {
        name: '文件与附件 插件',
      }),
    ).toBeInTheDocument();
  });

  it.each([
    ['kernel', 'zh-CN', '内核', '并发操作协调'],
    ['plugins', 'en-US', 'Plugins', 'AI & agents'],
  ])(
    'lists %s alphabetically without functional subgroups',
    async (kind, locale, tab, title) => {
      await render(`/foundation-guide/${kind}`, locale);
      expect(
        screen.getByRole('link', { name: new RegExp(`^${tab}\\s*\\d+$`) }),
      ).toHaveAttribute('aria-current', 'page');
      const directory = screen.getByRole('complementary');
      expect(directoryIds(directory)).toEqual(
        packages
          .filter((entry) => entry.kind === kind)
          .sort((a, b) => a.name.localeCompare(b.name, 'en'))
          .map((entry) => entry.id),
      );
      expect(within(directory).queryByRole('heading')).not.toBeInTheDocument();
      expect(
        within(screen.getByRole('article')).getByRole('heading', {
          name: title,
        }),
      ).toBeInTheDocument();
    },
  );

  it('covers every declared plugin with bilingual business prompts and retains valid related links', () => {
    const expected = [
      ...new Set(
        [
          ...Object.keys(applicationManifest.dependencies),
          ...Object.keys(applicationManifest.devDependencies),
        ].filter((name) => name.includes('/app-plugin-')),
      ),
    ].sort();
    expect(
      packages
        .filter((entry) => entry.kind === 'plugins')
        .map((entry) => entry.name)
        .sort(),
    ).toEqual(expected);
    expect(new Set(packages.map((entry) => entry.id)).size).toBe(
      packages.length,
    );
    for (const id of [
      'app-client',
      'app-server',
      'service-provider',
      'authorization',
      'drive',
    ]) {
      expect(
        packages.some((entry) => entry.id === id || entry.related.includes(id)),
      ).toBe(false);
    }
    for (const entry of packages) {
      expect(entry.copyKey).toBeUndefined();
      for (const locale of [enUS, zhCN]) {
        const business =
          locale.business[entry.id as keyof typeof locale.business];
        expect(business).toMatchObject({
          summary: expect.any(String),
          scenario: expect.any(String),
          prompt: expect.any(String),
        });
        expect(business.prompt.length).toBeGreaterThan(60);
        expect(business.prompt).not.toMatch(
          /@nocobase\/|defineAppConfig|server\/config|pnpm /,
        );
      }
      for (const id of entry.related)
        expect(
          packages.some((item) => item.id === id),
          `${entry.id}: ${id}`,
        ).toBe(true);
    }
  });

  it('includes new dependencies without a whitelist and supplies a business fallback', () => {
    const result = createPackageCatalog({
      dependencies: { '@nocobase/app-plugin-file': 'workspace:*', react: '*' },
      devDependencies: {
        '@nocobase/app-plugin-file': 'workspace:*',
        '@nocobase/app-plugin-template-print': 'workspace:*',
      },
      optionalDependencies: { '@third-party/app-plugin-new': '*' },
      peerDependencies: { 'app-plugin-peer': '*' },
    }).filter((entry) => entry.kind === 'plugins');
    expect(result.map((entry) => entry.name).sort()).toEqual([
      '@nocobase/app-plugin-file',
      '@nocobase/app-plugin-template-print',
      '@third-party/app-plugin-new',
      'app-plugin-peer',
    ]);
    expect(
      result.find((entry) => entry.name === '@third-party/app-plugin-new'),
    ).toMatchObject({ copyKey: 'unlistedPlugin', related: [] });
    for (const locale of [enUS, zhCN])
      expect(locale.business.unlistedPlugin.prompt).toBeTruthy();
  });

  it('finds example plugins and keeps maintenance commands in the collapsed reference', async () => {
    await render('/foundation-guide/plugins', 'zh-CN');
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '示例插件' },
    });
    const directory = screen.getByRole('complementary');
    expect(directoryIds(directory)).toHaveLength(
      packages.filter((entry) => entry.category === 'example').length,
    );
    fireEvent.click(
      within(directory).getByRole('link', { name: '维护工具示例 插件' }),
    );
    await screen.findByRole('heading', { name: '维护工具示例' });
    const detail = screen.getByRole('article');
    expect(detail).toHaveTextContent('数据检查');
    expect(detail).not.toHaveTextContent('pnpm nocobase');
    expect(
      within(detail).queryByRole('link', { name: '打开示例' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '开发参考' }));
    await waitFor(() =>
      expect(detail).toHaveTextContent('pnpm nocobase cli-example --help'),
    );
  });

  it('preserves Skill scope and links to the runnable printing example', async () => {
    await render('/foundation-guide/plugins/app-plugin-template-print');
    const detail = screen.getByRole('article');
    expect(within(detail).getByText('Skill')).toBeInTheDocument();
    expect(detail).toHaveTextContent('guidance');
    fireEvent.click(
      screen.getByRole('button', { name: 'Development reference' }),
    );
    await waitFor(() =>
      expect(detail).toHaveTextContent('no runtime renderer'),
    );
    fireEvent.click(
      within(detail).getByRole('link', { name: 'Template printing example' }),
    );
    await screen.findByRole('heading', { name: 'Template printing example' });
    expect(
      within(screen.getByRole('article')).getByRole('link', {
        name: 'Open example',
      }),
    ).toHaveAttribute('href', '/template-print-example');
    expect(
      screen.getByRole('button', { name: 'Development reference' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('follows a related plugin across categories and keeps documentation optional', async () => {
    await render('/foundation-guide/kernel/db');
    fireEvent.click(
      within(screen.getByRole('article')).getByRole('link', {
        name: 'Files & attachments',
      }),
    );
    await screen.findByRole('heading', { name: 'Files & attachments' });
    expect(screen.getByRole('link', { name: /^Plugins/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.queryByRole('link', { name: 'Read integration guide' }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Development reference' }),
    );
    expect(
      await screen.findByRole('link', { name: 'Read integration guide' }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining('/packages/plugins/app-plugin-file/README.md'),
    );
  });

  it.each([
    ['drive', '文件存储', 'packages/libs/drive/skills/nocobase-drive/SKILL.md'],
    ['authorization', '授权引擎', 'packages/libs/authorization/README.md'],
  ])(
    'finds %s while keeping core usage out of the main content',
    async (core, title, docs) => {
      await render('/foundation-guide/all', 'zh-CN');
      const directory = screen.getByRole('complementary');
      for (const query of [`@nocobase/${core}`, title]) {
        fireEvent.change(screen.getByRole('searchbox'), {
          target: { value: query },
        });
        expect(within(directory).getAllByRole('link')).toHaveLength(1);
      }
      fireEvent.click(within(directory).getByRole('link'));
      const detail = screen.getByRole('article');
      expect(detail).not.toHaveTextContent('@nocobase/');
      expect(
        screen.queryByRole('region', { name: '底层内核' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('region', { name: '让 Agent 帮你搭建' }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: '开发参考' }));
      const coreSection = await screen.findByRole('region', {
        name: '底层内核',
      });
      expect(coreSection).toHaveTextContent(`@nocobase/${core}`);
      expect(
        within(coreSection).getByRole('link', { name: '阅读内核使用指南' }),
      ).toHaveAttribute('href', expect.stringContaining(docs));
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'MISSING_CAPABILITY' },
      });
      expect(within(directory).getByRole('status')).toHaveTextContent(
        '没有找到匹配项',
      );
      fireEvent.click(screen.getByRole('button', { name: '清除搜索' }));
      expect(directoryIds(directory)).toHaveLength(packages.length);
    },
  );

  it.each(['en-US', 'zh-CN'])(
    'copies the complete business prompt in %s',
    async (locale) => {
      const user = userEvent.setup();
      const clipboard = vi
        .spyOn(navigator.clipboard, 'writeText')
        .mockResolvedValue();
      await render('/foundation-guide/all/app-plugin-file', locale);
      const copy = locale === 'zh-CN' ? zhCN : enUS;
      await user.click(screen.getByRole('button', { name: copy.copyPrompt }));
      expect(clipboard).toHaveBeenCalledWith(
        `${copy.business['app-plugin-file'].prompt}\n\n${copy.promptEnding}`,
      );
      expect(await screen.findByText(copy.promptCopied)).toBeInTheDocument();
      const prompt = screen.getByRole('region', { name: copy.agentPrompt });
      expect(prompt).not.toHaveTextContent('@nocobase/');
    },
  );

  it('offers manual copying after clipboard failure, allows retry and clears feedback on navigation', async () => {
    const user = userEvent.setup();
    const clipboard = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValue(new Error('denied'));
    await render('/foundation-guide/all/app-plugin-file', 'zh-CN');
    await user.click(screen.getByRole('button', { name: '复制提示词' }));
    expect(await screen.findByText(zhCN.promptCopyFailed)).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: zhCN.agentPrompt }),
    ).toHaveTextContent(zhCN.business['app-plugin-file'].prompt);
    clipboard.mockResolvedValue();
    await user.click(screen.getByRole('button', { name: '复制提示词' }));
    expect(await screen.findByText(zhCN.promptCopied)).toBeInTheDocument();
    await user.click(
      within(screen.getByRole('article')).getByRole('link', {
        name: '业务数据',
      }),
    );
    await screen.findByRole('heading', { name: '业务数据' });
    expect(screen.queryByText(zhCN.promptCopied)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '复制提示词' }));
    expect(clipboard).toHaveBeenLastCalledWith(
      `${zhCN.business.db.prompt}\n\n${zhCN.promptEnding}`,
    );
  });

  it('returns from a direct guide and recovers from an invalid URL', async () => {
    await render('/foundation-guide/kernel/unknown');
    expect(screen.getByRole('status')).toHaveTextContent('Entry not found');
    fireEvent.click(screen.getByRole('link', { name: 'Back to directory' }));
    await screen.findByRole('heading', { name: 'Concurrent operations' });
    fireEvent.click(
      within(screen.getByRole('complementary')).getByRole('link', {
        name: 'Business data Core',
      }),
    );
    await screen.findByRole('heading', { name: 'Business data' });
    fireEvent.click(
      within(screen.getByRole('article')).getByRole('link', {
        name: 'Back to directory',
      }),
    );
    await screen.findByRole('heading', { name: 'Concurrent operations' });
  });
});
