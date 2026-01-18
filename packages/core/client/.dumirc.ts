import { getUmiConfig } from '@nocobase/devtools/umiConfig';
import { defineConfig } from 'dumi';
import { defineThemeConfig } from 'dumi-theme-nocobase';

const umiConfig = getUmiConfig();
process.env.DOC_LANG = process.env.DOC_LANG || 'zh-CN';
const lang = process.env.DOC_LANG;

console.log('process.env.DOC_LANG', lang);

export default defineConfig({
  hash: true,
  mfsu: false,
  alias: {
    ...umiConfig.alias,
  },
  fastRefresh: false, // 热更新会导致 Context 丢失，不开启
  // ssr: {},
  // exportStatic: {
  //   ignorePreRenderError: true
  // },
  cacheDirectoryPath: `node_modules/.docs-client-${lang}-cache`,
  outputPath: `./dist/${lang}`,
  resolve: {
    docDirs: [`./docs-v2/${lang}`],
    atomDirs: [
      // { type: 'component', dir: 'src/schema-component/antd' },
    ],
  },
  jsMinifierOptions: {
    target: ['chrome80', 'es2020'],
  },
  locales: lang === 'zh-CN' ? [{ id: 'zh-CN', name: '中文' },] : [{ id: 'en-US', name: 'English' }],
  themeConfig: defineThemeConfig({
    title: 'NocoBase',
    logo: 'https://www.nocobase.com/images/logo.png',
    github: 'https://github.com/nocobase/nocobase',
    footer: 'nocobase | Copyright © 2022',
    // sidebarGroupModePath: ['/components'],
    nav: [
      {
        title: 'Context',
        link: '/context',
      },
    ],
    sidebarEnhance: {
      '/context': [
        {
          title: 'collection',
          link: '/context/collection',
        },
        {
          title: 'collection-field',
          link: '/context/collection-field',
        },
        {
          title: 'data-source',
          link: '/context/data-source',
        },
        {
          title: 'defineProperty',
          link: '/context/define-property',
        },
        {
          title: 'defineMethod',
          link: '/context/define-method',
        },
        {
          title: 'getPropertyMetaTree',
          link: '/context/get-property-meta-tree',
        },
        {
          title: 'getVar',
          link: '/context/get-var',
        },
        {
          title: 'dataSourceManager',
          link: '/context/data-source-manager',
        },
        {
          title: 'importAsync',
          link: '/context/import-async',
        },
        {
          title: 'requireAsync',
          link: '/context/require-async',
        },
        {
          title: 'resolveJsonTemplate',
          link: '/context/resolve-json-template',
        },
        {
          title: 'libs',
          link: '/context/libs',
        },
        {
          title: 'libs.antd',
          link: '/context/libs-antd',
        },
        {
          title: 'libs.dayjs',
          link: '/context/libs-dayjs',
        },
        {
          title: 'exit',
          link: '/context/exit',
        },
        {
          title: 'exitAll',
          link: '/context/exit-all',
        },
        {
          title: 'onRefReady',
          link: '/context/on-ref-ready',
        },
        {
          title: 'api',
          link: '/context/api',
        },
        {
          title: 'acl',
          link: '/context/acl',
        },
        {
          title: 'aclCheck',
          link: '/context/acl-check',
        },
      ],
    },
    localesEnhance: [
      { id: 'zh-CN', switchPrefix: '中', hostname: 'client.docs-cn.nocobase.com' },
      { id: 'en-US', switchPrefix: 'en', hostname: 'client.docs.nocobase.com' }
    ],
  }),
});
