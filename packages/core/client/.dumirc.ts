import { getUmiConfig } from '@nocobase/devtools/umiConfig';
import { defineConfig } from 'dumi';
import { defineThemeConfig } from 'dumi-theme-nocobase';

const umiConfig = getUmiConfig();
process.env.DOC_LANG = process.env.DOC_LANG || 'zh-CN';
const lang = process.env.DOC_LANG;

console.log('process.env.DOC_LANG', lang);

export default defineConfig({
  hash: true,
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
    docDirs: [`./docs/${lang}`],
    atomDirs: [
      { type: 'component', dir: 'src/schema-component/antd' },
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
        title: 'API',
        link: '/core/application/application',
      },
      {
        title: 'Components',
        link: '/components/action',
      },
      {
        title: 'Home site',
        link: lang === 'zh-CN' ? 'https://docs-cn.nocobase.com' : 'https://docs.nocobase.com',
      }
      // {
      //   title: 'UI Schema',
      //   link: '/ui-schema',
      // },
    ],
    sidebarEnhance: {
      '/core': [
        {
          title: 'Application',
          type: 'group',
          children: [
            {
              title: 'Application',
              link: '/core/application/application',
            },
            {
              title: 'Plugin',
              link: '/core/application/plugin',
            },
            {
              title: 'PluginManager',
              link: '/core/application/plugin-manager',
            },
            {
              title: 'RouterManager',
              link: '/core/application/router-manager',
            },
            {
              title: 'PluginSettingsManager',
              link: '/core/application/plugin-settings-manager',
            },
            {
              title: 'Request',
              link: '/core/request',
            },
          ],
        },
        {
          title: 'UI Schema',
          type: 'group',
          children: [
            {
              title: 'SchemaComponent',
              link: '/core/ui-schema/schema-component',
            },
            {
              title: 'Designable',
              link: '/core/ui-schema/designable',
            },
            {
              title: 'SchemaInitializer',
              link: '/core/ui-schema/schema-initializer',
            },
            {
              title: 'SchemaInitializerManager',
              link: '/core/ui-schema/schema-initializer-manager',
            },
            {
              title: 'SchemaSettings',
              link: '/core/ui-schema/schema-settings',
            },
            {
              title: 'SchemaSettingsManager',
              link: '/core/ui-schema/schema-settings-manager',
            },
            {
              title: 'SchemaToolbar',
              link: '/core/ui-schema/schema-toolbar',
            },
          ],
        },
        {
          title: 'Data Source',
          type: 'group',
          children: [
            {
              title: 'DataSourceManager',
              link: '/core/data-source/data-source-manager',
            },
            {
              title: 'DataSourceManagerProvider',
              link: '/core/data-source/data-source-manager-provider',
            },
            {
              title: 'DataSource',
              link: '/core/data-source/data-source',
            },
            {
              title: 'DataSourceProvider',
              link: '/core/data-source/data-source-provider',
            },
            {
              title: 'CollectionManager',
              link: '/core/data-source/collection-manager',
            },
            {
              title: 'CollectionManagerProvider',
              link: '/core/data-source/collection-manager-provider',
            },
            {
              title: 'CollectionTemplateManager',
              link: '/core/data-source/collection-template-manager',
            },
            {
              title: 'CollectionTemplate',
              link: '/core/data-source/collection-template',
            },
            {
              title: 'Collection',
              link: '/core/data-source/collection',
            },
            {
              title: 'CollectionProvider',
              link: '/core/data-source/collection-provider',
            },
            {
              title: 'CollectionMixins',
              link: '/core/data-source/collection-mixins',
            },
            {
              title: 'CollectionField',
              link: '/core/data-source/collection-field',
            },
            {
              title: 'CollectionFieldInterfaceManager',
              link: '/core/data-source/collection-field-interface-manager',
            },
            {
              title: 'CollectionFieldInterface',
              link: '/core/data-source/collection-field-interface',
            },
            {
              title: 'AssociationProvider',
              link: '/core/data-source/association-provider',
            },
            {
              title: 'ExtendCollectionsProvider',
              link: '/core/data-source/extend-collections-provider',
            },
            {
              title: 'Collection Fields To Initializer Items',
              link: '/core/data-source/collection-fields-to-initializer-items',
            },
          ]
        },
        {
          title: 'DataBlock',
          type: 'group',
          children: [
            {
              title: 'CollectionRecord',
              link: '/core/data-block/collection-record',
            },
            {
              title: 'CollectionRecordProvider',
              link: '/core/data-block/collection-record-provider',
            },
            {
              title: 'DataBlockProvider',
              link: '/core/data-block/data-block-provider',
            },
            {
              title: 'DataBlockResourceProvider',
              link: '/core/data-block/data-block-resource-provider',
            },
            {
              title: 'DataBlockRequestProvider',
              link: '/core/data-block/data-block-request-provider',
            },
          ]
        }
      ],
      '/components': [
        {
          title: 'Action',
          type: 'group',
          children: [
            {
              "title": "Action",
              "link": "/components/action"
            },
            {
              "title": "Filter",
              "link": "/components/filter"
            },
            {
              "title": "LinkageFilter",
              "link": "/components/linkage-filter"
            },
          ]
        },
        {
          title: 'Field',
          type: 'group',
          children: [
            {
              "title": "Checkbox",
              "link": "/components/checkbox"
            },
            {
              "title": "Cascader",
              "link": "/components/cascader"
            },
            {
              "title": "ColorPicker",
              "link": "/components/color-picker"
            },
            {
              "title": "ColorSelect",
              "link": "/components/color-select"
            },
            {
              "title": "DatePicker",
              "link": "/components/date-picker"
            },
            {
              "title": "TimePicker",
              "link": "/components/time-picker"
            },
            {
              "title": "IconPicker",
              "link": "/components/icon-picker"
            },
            {
              "title": "InputNumber",
              "link": "/components/input-number"
            },
            {
              "title": "Input",
              "link": "/components/input"
            },
            {
              "title": "AutoComplete",
              "link": "/components/auto-complete"
            },
            {
              "title": "NanoIDInput",
              "link": "/components/nanoid-input"
            },
            {
              "title": "Password",
              "link": "/components/password"
            },
            {
              "title": "Percent",
              "link": "/components/percent"
            },
            {
              "title": "Radio",
              "link": "/components/radio"
            },
            {
              "title": "Select",
              "link": "/components/select"
            },
            {
              "title": "RemoteSelect",
              "link": "/components/remote-select"
            },
            {
              "title": "TreeSelect",
              "link": "/components/tree-select"
            },
            {
              "title": "Upload",
              "link": "/components/upload"
            },
            {
              "title": "CollectionSelect",
              "link": "/components/collection-select"
            },
            {
              "title": "Cron",
              "link": "/components/cron"
            },
            {
              "title": "Markdown",
              "link": "/components/markdown"
            },
            {
              "title": "Variable",
              "link": "/components/variable"
            },
            {
              "title": "QuickEdit",
              "link": "/components/quick-edit"
            },
            {
              "title": "RichText",
              "link": "/components/rich-text"
            }
          ]
        },
        {
          title: 'Block',
          type: 'group',
          children: [
            {
              "title": "BlockItem",
              "link": "/components/block-item"
            },
            {
              "title": "CardItem",
              "link": "/components/card-item"
            },
            {
              "title": "FormItem",
              "link": "/components/form-item"
            },
            {
              "title": "FormV2",
              "link": "/components/form-v2"
            },
            {
              "title": "TableV2",
              "link": "/components/table-v2"
            },
            {
              "title": "Details",
              "link": "/components/details"
            },
            {
              "title": "GridCard",
              "link": "/components/grid-card"
            },
            {
              "title": "Grid",
              "link": "/components/grid"
            },
            {
              "title": "List",
              "link": "/components/list"
            },
          ]
        },
        {
          title: 'Others',
          type: 'group',
          children: [
            {
              "title": "Tabs",
              "link": "/components/tabs"
            },
            {
              "title": "ErrorFallback",
              "link": "/components/error-fallback"
            },
            {
              "title": "G2Plot",
              "link": "/components/g2plot"
            },
            {
              "title": "Menu",
              "link": "/components/menu"
            },
            {
              "title": "Pagination",
              "link": "/components/pagination"
            },
          ]
        },
      ]
      // '/ui-schema': [
      //   {
      //     title: 'Overview',
      //     link: '/ui-schema',
      //   },
      //   {
      //     title: 'Globals',
      //     type: 'group',
      //     children: [
      //       {
      //         title: 'Menu',
      //         link: '/ui-schema/globals/menu',
      //       },
      //       {
      //         title: 'Page',
      //         link: '/ui-schema/globals/page',
      //       },
      //       {
      //         title: 'Tabs',
      //         link: '/ui-schema/globals/tabs',
      //       },
      //     ],
      //   },
      //   {
      //     title: 'Blocks',
      //     type: 'group',
      //     children: [
      //       {
      //         title: 'Overview',
      //         link: '/ui-schema/blocks',
      //       },
      //       {
      //         title: 'Data blocks',
      //         children: [
      //           {
      //             title: 'Overview',
      //             link: '/ui-schema/blocks/data',
      //           },
      //           {
      //             title: 'Table',
      //             link: '/ui-schema/blocks/data/table',
      //           },
      //           {
      //             title: 'Form',
      //             link: '/ui-schema/blocks/data/form',
      //           },
      //           {
      //             title: 'Form(Read pretty)',
      //             link: '/ui-schema/blocks/data/form-read-pretty',
      //           },
      //           {
      //             title: 'Details',
      //             link: '/ui-schema/blocks/data/details',
      //           },
      //           {
      //             title: 'List',
      //             link: '/ui-schema/blocks/data/list',
      //           },
      //           {
      //             title: 'Grid Card',
      //             link: '/ui-schema/blocks/data/grid-card',
      //           },
      //           {
      //             title: 'Calendar',
      //             link: '/ui-schema/blocks/data/calendar',
      //           },
      //           {
      //             title: 'Kanban',
      //             link: '/ui-schema/blocks/data/kanban',
      //           },
      //           {
      //             title: 'Map',
      //             link: '/ui-schema/blocks/data/map',
      //           },
      //           {
      //             title: 'Gantt',
      //             link: '/ui-schema/blocks/data/gantt',
      //           },
      //           {
      //             title: 'Charts',
      //             link: '/ui-schema/blocks/data/charts',
      //           },
      //         ],
      //       },
      //       {
      //         title: 'Filter blocks',
      //         children: [
      //           {
      //             title: 'Collapse',
      //             link: '/ui-schema/blocks/filter/collapse',
      //           },
      //           {
      //             title: 'Form',
      //             link: '/ui-schema/blocks/filter/form',
      //           },
      //         ],
      //       },
      //       {
      //         title: 'Other blocks',
      //         children: [
      //           {
      //             title: 'iframe',
      //             link: '/ui-schema/blocks/others/iframe',
      //           },
      //           {
      //             title: 'Markdown',
      //             link: '/ui-schema/blocks/others/markdown',
      //           },
      //           {
      //             title: 'Workflow todos',
      //             link: '/ui-schema/blocks/others/workflow-todo',
      //           },
      //         ],
      //       },
      //     ],
      //   },
      //   {
      //     title: 'Fields',
      //     type: 'group',
      //     children: [
      //       {
      //         title: 'Overview',
      //         link: '/ui-schema/fields',
      //       },
      //       {
      //         title: 'FormItem',
      //         link: '/ui-schema/fields/form-item',
      //       },
      //       {
      //         title: 'TableColumn',
      //         link: '/ui-schema/fields/table-column',
      //       },
      //       {
      //         title: 'Association',
      //         children: [
      //           {
      //             title: 'Title',
      //             link: '/ui-schema/fields/association-components/title',
      //           },
      //           {
      //             title: 'Tag',
      //             link: '/ui-schema/fields/association-components/tag',
      //           },
      //           {
      //             title: 'Select',
      //             link: '/ui-schema/fields/association-components/select',
      //           },
      //           {
      //             title: 'RecordPicker',
      //             link: '/ui-schema/fields/association-components/record-picker',
      //           },
      //           {
      //             title: 'Cascader',
      //             link: '/ui-schema/fields/association-components/cascader-select',
      //           },
      //           {
      //             title: 'Sub-form',
      //             link: '/ui-schema/fields/association-components/sub-form',
      //           },
      //           {
      //             title: 'Sub-form(Popover)',
      //             link: '/ui-schema/fields/association-components/sub-form-popover',
      //           },
      //           {
      //             title: 'Sub-details',
      //             link: '/ui-schema/fields/association-components/sub-details',
      //           },
      //           {
      //             title: 'Sub-table',
      //             link: '/ui-schema/fields/association-components/cascader-select',
      //           },
      //           {
      //             title: 'File manager',
      //             link: '/ui-schema/fields/association-components/file-manager',
      //           },
      //         ],
      //       },
      //     ],
      //   },
      //   {
      //     title: 'Actions',
      //     type: 'group',
      //     children: [
      //       {
      //         title: 'Overview',
      //         link: '/ui-schema/actions',
      //       },
      //       {
      //         title: 'Add new',
      //         link: '/ui-schema/actions/add-new',
      //       },
      //       {
      //         title: 'View',
      //         link: '/ui-schema/actions/view',
      //       },
      //       {
      //         title: 'Edit',
      //         link: '/ui-schema/actions/edit',
      //       },
      //       {
      //         title: 'Delete',
      //         link: '/ui-schema/actions/delete',
      //       },
      //       {
      //         title: 'Submit',
      //         link: '/ui-schema/actions/submit',
      //       },
      //       {
      //         title: 'Filter',
      //         link: '/ui-schema/actions/filter',
      //       },
      //       {
      //         title: 'Refresh',
      //         link: '/ui-schema/actions/refresh',
      //       },
      //       {
      //         title: 'Print',
      //         link: '/ui-schema/actions/print',
      //       },
      //       {
      //         title: 'Duplicate',
      //         link: '/ui-schema/actions/duplicate',
      //       },
      //       {
      //         title: 'Export',
      //         link: '/ui-schema/actions/export',
      //       },
      //       {
      //         title: 'Import',
      //         link: '/ui-schema/actions/import',
      //       },
      //       {
      //         title: 'Bulk update',
      //         link: '/ui-schema/actions/bulk-update',
      //       },
      //       {
      //         title: 'Bulk edit',
      //         link: '/ui-schema/actions/bulk-edit',
      //       },
      //       {
      //         title: 'Add record(任意表)',
      //         link: '/ui-schema/actions/add-record',
      //       },
      //       {
      //         title: 'Update record',
      //         link: '/ui-schema/actions/update-record',
      //       },
      //       {
      //         title: 'Save record',
      //         link: '/ui-schema/actions/save-record',
      //       },
      //       {
      //         title: 'Custom request',
      //         link: '/ui-schema/actions/custom-request',
      //       },
      //       {
      //         title: 'Submit to workflow',
      //         link: '/ui-schema/actions/submit-to-workflow',
      //       },
      //     ],
      //   },
      // ],
    },
    localesEnhance: [
      { id: 'zh-CN', switchPrefix: '中', hostname: 'client.docs-cn.nocobase.com' },
      { id: 'en-US', switchPrefix: 'en', hostname: 'client.docs.nocobase.com' }
    ],
  }),
});
