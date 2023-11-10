import { getUmiConfig } from '@nocobase/devtools/umiConfig';
import { defineConfig } from 'dumi';
import { defineThemeConfig } from 'dumi-theme-nocobase';

const umiConfig = getUmiConfig();

export default defineConfig({
  hash: true,
  alias: {
    ...umiConfig.alias,
  },
  resolve: {
    atomDirs: [
      { type: 'api', dir: 'src' },
      { type: 'api', dir: 'src/schema-component/antd' },
      { type: 'api', dir: 'src/route-switch/antd' },
    ],
  },
  themeConfig: defineThemeConfig({
    title: 'NocoBase',
    logo: 'https://www.nocobase.com/images/logo.png',
    github: 'https://github.com/nocobase/nocobase',
    footer: 'nocobase | Copyright © 2022',
    // sidebarGroupModePath: ['/components'],
    nav: [
      {
        title: 'API',
        link: '/apis/application',
      },
    ],
    sidebarEnhance: {
      '/apis': [
        {
          title: 'Core',
          type: 'group',
          children: [
            {
              title: 'Application',
              children: [
                {
                  title: 'Application',
                  link: '/apis/application',
                },
                {
                  title: 'APIClient',
                  link: '/apis/api-client',
                },
                {
                  title: 'SettingsCenter',
                  link: '#',
                },
              ],
            },
            {
              title: 'UI schema designer',
              children: [
                {
                  title: 'SchemaComponent',
                  link: '#',
                },
                {
                  title: 'SchemaInitializer',
                  link: '#',
                },
                {
                  title: 'SchemaSettings',
                  link: '#',
                },
                {
                  title: 'DNDContext & DragHandler',
                  link: '#',
                },
              ],
            },
            {
              title: 'Collection Manager',
              link: '#',
            },
            {
              title: 'BlockProvider',
              link: '#',
            },
            {
              title: 'RecordProvider',
              link: '#',
            },
          ],
        },
        {
          title: 'React components',
          type: 'group',
          children: [
            {
              title: 'Board',
              link: '#',
            },
            {
              title: 'Icon',
              link: '#',
            },
          ],
        },
        {
          title: 'Schema components',
          type: 'group',
          children: [
            {
              title: 'Input',
              link: '#',
            },
          ],
        },
      ],
    },
  }),
});
