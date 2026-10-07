// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';

import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider, useTranslation } from '@nocobase/i18n/client';
import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import enUS from '../client/locales/en-US.js';
import locales from '../client/locales/index.js';
import zhCN from '../client/locales/zh-CN.js';
import routes from '../client/routes.js';

const NAMESPACE = '@nocobase/app-plugin-ai-employee';
const registryRoot = path.resolve(
  import.meta.dirname,
  '../registry/nocobase-ai',
);

function RegistryCopy() {
  const { t } = useTranslation(NAMESPACE);
  return <h1>{t('demo.chat.title', 'AI Chat Window')}</h1>;
}

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return /\.tsx?$/u.test(entry.name) ? [entryPath] : [];
  });
}

/** The literal keys a source passes to `t()`, wherever Prettier wrapped the call. */
function translationKeys(source: string): string[] {
  return [...source.matchAll(/\bt\(\s*'([^']+)'/gu)].map((match) => match[1]!);
}

it('translates Registry copy with the active application language', async () => {
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: {} }),
    'zh-CN': async () => ({ default: {} }),
  });
  runtime.registerNamespace('@nocobase/app-plugin-ai-employee', locales);
  await runtime.init('zh-CN');
  render(
    <I18nProvider runtime={runtime}>
      <RegistryCopy />
    </I18nProvider>,
  );
  expect(screen.getByRole('heading')).toHaveTextContent('AI 聊天窗口');
  await act(() => runtime.changeLanguage('en-US'));
  expect(screen.getByRole('heading')).toHaveTextContent('AI Chat Window');
  await act(() => runtime.changeLanguage('zh-CN'));
  expect(screen.getByRole('heading')).toHaveTextContent('AI 聊天窗口');
});

it('resolves development navigation and breadcrumbs in the plugin namespace', async () => {
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: {} }),
  });
  const ns = '@nocobase/app-plugin-ai-employee';
  runtime.registerNamespace(ns, locales);
  await runtime.init('zh-CN');
  const dev = routes.find((item) => item.parent === 'dev');
  if (!dev || dev.parent !== 'dev') throw new Error('Missing dev routes');
  const group = dev.routes[0]!;
  const items = [group, ...group.children!];
  expect(
    items.map((item) => runtime.i18n.t(item.navigation!.title!, { ns })),
  ).toEqual([
    'AI 组件',
    '聊天窗口',
    '悬浮聊天',
    '员工任务',
    '页面上下文',
    '工具卡片',
  ]);
  expect(
    items.map((item) => runtime.i18n.t(item.breadcrumb!.title!, { ns })),
  ).toEqual([
    'AI 组件',
    '聊天窗口',
    '悬浮聊天',
    '员工任务',
    '页面上下文',
    '工具卡片',
  ]);
});

it('translates the Registry in the plugin namespace, from the plugin locale files', () => {
  // An installed copy has no locale files of its own: the plugin it calls loads them, as for any plugin page.
  expect(fs.existsSync(path.join(registryRoot, 'locales'))).toBe(false);
  const files = sourceFiles(registryRoot).map((file) => ({
    file: path.relative(registryRoot, file),
    source: fs.readFileSync(file, 'utf8'),
  }));
  const translating = files.filter(
    ({ source }) => translationKeys(source).length,
  );
  expect(translating.length).toBeGreaterThan(10);
  expect(
    translating
      .filter(
        ({ source }) => !source.includes(`useTranslation('${NAMESPACE}')`),
      )
      .map(({ file }) => file),
  ).toEqual([]);

  const missing = (messages: Record<string, unknown>) =>
    translating.flatMap(({ file, source }) =>
      translationKeys(source)
        .filter((key) => !(key in messages))
        .map((key) => `${key} (${file})`),
    );
  expect(missing(enUS)).toEqual([]);
  expect(missing(zhCN)).toEqual([]);
});
