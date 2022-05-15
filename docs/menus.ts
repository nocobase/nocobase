export default [
  {
    title: 'Welcome',
    'title.zh-CN': '欢迎',
    type: 'group',
    children: [
      '/index',
      '/roadmap',
    ],
  },
  {
    title: 'Getting started',
    'title.zh-CN': '快速开始',
    type: 'group',
    children: [
      '/getting-started/installation',
      '/getting-started/upgrading',
    ],
  },
  {
    title: 'User manual',
    'title.zh-CN': '用户手册',
    type: 'group',
    children: [
      {
        title: 'Introduction',
        'title.zh-CN': '了解 NocoBase',
        type: 'subMenu',
        children: [
          '/user-manual/introduction/5-minutes-to-get-started',
          '/user-manual/introduction/important-features',
          '/user-manual/introduction/why-nocobase',
        ],
      },
      {
        title: 'Advanced Guide',
        'title.zh-CN': '深入 NocoBase',
        type: 'subMenu',
        children: [
          '/advanced-guide/functional-zoning',
          '/advanced-guide/collections',
          '/advanced-guide/menus',
          '/advanced-guide/blocks',
          '/advanced-guide/actions',
          '/advanced-guide/roles-permissions',
          '/advanced-guide/tabs',
          '/advanced-guide/file-storages',
          '/advanced-guide/system-settings',
          '/advanced-guide/plugins',
        ],
      },
    ],
  },
  {
    title: 'Development',
    'title.zh-CN': '开发指南',
    type: 'group',
    children: [
      '/development/directory-structure',
      '/development/env',
      '/development/nocobase-cli',
      '/development/http-api',
      '/development/javascript-sdk',
      {
        title: 'Plugin development',
        'title.zh-CN': '插件开发',
        type: 'subMenu',
        children: [
          '/development/plugin-development/index',
          '/development/plugin-development/database',
          '/development/plugin-development/resourcer',
          '/development/plugin-development/acl',
          '/development/plugin-development/middleware',
          '/development/plugin-development/events',
          '/development/plugin-development/i18n',
        ],
      },
    ],
  },
  {
    title: 'Community',
    'title.zh-CN': '社区',
    type: 'group',
    children: [
      '/contributing',
      '/faq',
      '/release-notes',
    ],
  }
];
