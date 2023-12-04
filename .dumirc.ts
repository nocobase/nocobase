import { getUmiConfig } from '@nocobase/devtools/umiConfig';
import { defineConfig } from 'dumi';
import { defineThemeConfig } from 'dumi-theme-nocobase';
import { nav, sidebar } from './docs/config';

const umiConfig = getUmiConfig();

const lang = process.env.DOC_LANG || 'en-US';

console.log('process.env.DOC_LANG', process.env.DOC_LANG);

// 设置多语言的 title
function setTitle(menuChildren) {
  if (!menuChildren) return;
  menuChildren.forEach((item) => {
    if (typeof item === 'object') {
      item.title = item[`title.${lang}`] || item.title;
      if (item.children) {
        setTitle(item.children);
      }
    }
  });
}
if (lang !== 'en-US') {
  Object.values(sidebar).forEach(setTitle);
}

export default defineConfig({
  hash: true,
  alias: {
    ...umiConfig.alias,
  },
  ssr: {

  },
  exportStatic: {
    ignorePreRenderError: true
  },
  cacheDirectoryPath: `node_modules/.docs-${lang}-cache`,
  outputPath: `./docs/dist/${lang}`,
  resolve: {
    docDirs: [`./docs/${lang}`]
  },
  locales: [
    { id: 'en-US', name: 'English' },
    { id: 'zh-CN', name: '中文' },
  ],
  themeConfig: defineThemeConfig({
    title: 'NocoBase',
    logo: 'https://www.nocobase.com/images/logo.png',
    nav: nav.map((item) => ({ ...item, title: (item[`title.${lang}`] || item.title) })),
    sidebarEnhance: sidebar as any,
    github: 'https://github.com/nocobase/nocobase',
    footer: 'nocobase | Copyright © 2022',
    localesEnhance: [
      { id: 'zh-CN', switchPrefix: '中', hostname: 'docs-cn.nocobase.com' },
      { id: 'en-US', switchPrefix: 'en', hostname: 'docs.nocobase.com' }
    ],
  }),
  // mfsu: true, // 报错
});
