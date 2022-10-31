export default {
  '/welcome': [
    {
      title: 'Welcome',
      'title.zh-CN': '欢迎',
      type: 'group',
      children: [
        '/welcome/introduction/index',
        '/welcome/introduction/features',
        '/welcome/introduction/when',
        '/welcome/introduction/v08-changelog'
        // '/welcome/introduction/learning-guide',
      ],
    },
    {
      title: 'Getting started',
      'title.zh-CN': '快速开始',
      type: 'group',
      children: [
        {
          title: 'Installation',
          'title.zh-CN': '安装',
          type: 'subMenu',
          children: [
            '/welcome/getting-started/installation/index',
            '/welcome/getting-started/installation/docker-compose',
            '/welcome/getting-started/installation/create-nocobase-app',
            '/welcome/getting-started/installation/git-clone',
          ],
        },
        {
          title: 'Upgrading',
          'title.zh-CN': '升级',
          type: 'subMenu',
          children: [
            '/welcome/getting-started/upgrading/index',
            '/welcome/getting-started/upgrading/docker-compose',
            '/welcome/getting-started/upgrading/create-nocobase-app',
            '/welcome/getting-started/upgrading/git-clone',
          ],
        },
      ],
    },
    {
      title: 'Community',
      'title.zh-CN': '社区',
      type: 'group',
      children: [
        '/welcome/community/contributing',
        // '/welcome/community/faq',
        '/welcome/community/translations',
        '/welcome/community/thanks',
      ],
    },
  ],
  '/manual': [
    {
      title: 'Quick Start',
      'title.zh-CN': '快速上手',
      type: 'group',
      children: [
        '/manual/quick-start/the-first-app',
        '/manual/quick-start/functional-zoning',
        '/manual/quick-start/ui-editor-mode',
        '/manual/quick-start/plugins',
      ],
    },
    {
      title: 'Core Concepts',
      'title.zh-CN': '核心概念',
      type: 'group',
      children: [
        '/manual/core-concepts/a-b-c',
        '/manual/core-concepts/collections',
        '/manual/core-concepts/blocks',
        '/manual/core-concepts/actions',
        '/manual/core-concepts/menus',
        '/manual/core-concepts/containers',
      ],
    },
    {
      title: 'Blocks Guide',
      'title.zh-CN': '区块指南',
      type: 'group',
      children: [
        '/manual/blocks-guide/charts',
      ],
    },
  ],
  '/development': [
    {
      title: 'Getting started',
      'title.zh-CN': '快速开始',
      type: 'group',
      children: [
        '/development/index',
        '/development/your-fisrt-plugin',
        '/development/learning-guide',
      ],
    },
    {
      title: '约束规范',
      'title.zh-CN': '约束规范',
      type: 'group',
      children: [
        '/development/app-ds',
        '/development/plugin-ds',
      ],
    },
    {
      title: 'Extension Guides',
      'title.zh-CN': '扩展指南',
      type: 'group',
      children: [
        '/development/guide/index',
        '/development/guide/collections-fields',
        '/development/guide/resources-actions',
        '/development/guide/middleware',
        '/development/guide/commands',
        '/development/guide/events',
        '/development/guide/i18n',
        '/development/guide/migration',
        {
          title: 'UI 设计器',
          type: 'subMenu',
          children: [
            // '/development/guide/ui-schema-designer/index',
            '/development/guide/ui-schema-designer/what-is-ui-schema',
            '/development/guide/ui-schema-designer/extending-schema-components',
            // '/development/guide/ui-schema-designer/insert-adjacent',
            '/development/guide/ui-schema-designer/designable',
            '/development/guide/ui-schema-designer/component-library',
            // '/development/guide/ui-schema-designer/collection-manager',
            // '/development/guide/ui-schema-designer/acl',
            '/development/guide/ui-schema-designer/x-designer',
            '/development/guide/ui-schema-designer/x-initializer',
          ],
        },
        '/development/guide/ui-router',
        '/development/guide/settings-center',
      ],
    },
    {
      title: 'HTTP API',
      type: 'group',
      children: ['/development/http-api/index', '/development/http-api/rest-api'],
    },
    {
      title: 'Others',
      'title.zh-CN': '其他',
      type: 'group',
      children: [
        '/development/others/testing',
        // '/development/pre-release/build',
      ],
    },
  ],
  // {
  //   title: 'Development',
  //   'title.zh-CN': '开发指南',
  //   type: 'group',
  //   children: [
  //     '/development/directory-structure',
  //     '/development/env',
  //     '/development/nocobase-cli',
  //     {
  //       title: 'HTTP API',
  //       'title.zh-CN': 'HTTP API',
  //       type: 'subMenu',
  //       children: [
  //         '/development/http-api/index',
  //         '/development/http-api/rest-api',
  //         '/development/http-api/action-api',
  //         '/development/http-api/javascript-sdk',
  //         '/development/http-api/filter-operators',
  //       ],
  //     },
  //     '/development/javascript-sdk',
  //     {
  //       title: 'Plugin development',
  //       'title.zh-CN': '插件开发',
  //       type: 'subMenu',
  //       children: [
  //         '/development/plugin-development/index',
  //         {
  //           title: 'Server',
  //           'title.zh-CN': 'Server',
  //           type: 'subMenu',
  //           children: [
  //             '/development/plugin-development/server/overview',
  //             '/development/plugin-development/server/database',
  //             '/development/plugin-development/server/resourcer',
  //             '/development/plugin-development/server/middleware',
  //             '/development/plugin-development/server/acl',
  //             '/development/plugin-development/server/events',
  //             '/development/plugin-development/server/i18n',
  //             '/development/plugin-development/server/cli',
  //             '/development/plugin-development/server/app-manager',
  //             '/development/plugin-development/server/plugin-manager',
  //           ],
  //         },
  //         {
  //           title: 'Client',
  //           'title.zh-CN': 'Client',
  //           type: 'subMenu',
  //           children: [
  //             '/development/plugin-development/client/overview',
  //             {
  //               title: 'Providers',
  //               'title.zh-CN': 'Providers',
  //               type: 'subMenu',
  //               children: [
  //                 '/development/plugin-development/client/providers/acl',
  //                 '/development/plugin-development/client/providers/antd',
  //                 '/development/plugin-development/client/providers/api-client',
  //                 '/development/plugin-development/client/providers/collection-manager',
  //                 '/development/plugin-development/client/providers/i18n',
  //                 '/development/plugin-development/client/providers/route-switch',
  //                 '/development/plugin-development/client/providers/schema-component',
  //                 '/development/plugin-development/client/providers/schema-initializer',
  //               ],
  //             },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },
  '/api': [
    '/api/index',
    '/api/env',
    {
      title: '@nocobase/server',
      type: 'subMenu',
      children: [
        '/api/server/application', 
        // '/api/server/plugin-manager', 
        '/api/server/plugin',
      ],
    },
    {
      title: '@nocobase/database',
      type: 'subMenu',
      children: [
        '/api/database/index',
        '/api/database/collection',
        '/api/database/field',
        '/api/database/repository',
        '/api/database/relation-repository/has-one-repository',
        '/api/database/relation-repository/has-many-repository',
        '/api/database/relation-repository/belongs-to-repository',
        '/api/database/relation-repository/belongs-to-many-repository',
        '/api/database/operators',
      ],
    },
    {
      title: '@nocobase/resourcer',
      type: 'subMenu',
      children: [
        '/api/resourcer/index',
        '/api/resourcer/resource',
        '/api/resourcer/action',
        '/api/resourcer/middleware',
      ],
    },
    {
      title: '@nocobase/acl',
      type: 'subMenu',
      children: [
        '/api/acl/index',
        '/api/acl/acl',
        '/api/acl/acl-role',
        '/api/acl/acl-resource',
        '/api/acl/acl-available-action',
        '/api/acl/acl-available-strategy',
        '/api/acl/allow-manager',
      ],
    },
    {
      title: '@nocobase/client',
      type: 'subMenu',
      children: [
        // '/api/client/index',
        '/api/client/application',
        '/api/client/route-switch',
        {
          title: 'SchemaDesigner',
          'title.zh-CN': 'SchemaDesigner',
          type: 'subMenu',
          children: [
            '/api/client/schema-designer/schema-component',
            '/api/client/schema-designer/schema-initializer',
            '/api/client/schema-designer/schema-settings',
          ],
        },
        {
          title: 'Extensions',
          'title.zh-CN': 'Extensions',
          type: 'subMenu',
          children: [
            // '/api/client/extensions/schema-component',
            '/api/client/extensions/collection-manager',
            '/api/client/extensions/block-provider',
            '/api/client/extensions/acl',
          ],
        },
      ],
    },
    {
      title: '@nocobase/cli',
      path: '/api/cli',
    },
    {
      title: '@nocobase/actions',
      path: '/api/actions',
    },
    {
      title: '@nocobase/sdk',
      path: '/api/sdk',
    },
  ],
};
