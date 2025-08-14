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
        title: 'Learn',
        link: '/learn',
      },
      {
        title: 'Models',
        link: '/models',
      },
      {
        title: 'Components',
        link: '/components',
      },
      {
        title: 'Examples',
        link: '/examples/flow-models/hello-world',
      },
      {
        title: 'API',
        link: '/api/flow-engine',
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
      '/components': [
        {
          title: 'Filter',
          type: 'group',
          children: [
            { title: '概览', link: '/components/filter' },
            { title: 'FilterGroup', link: '/components/filter/filter-group' },
            { title: '自定义 FilterItem', link: '/components/filter/custom-filter-item' },
          ],
        },
        {
          title: 'Variables',
          type: 'group',
          children: [
            { title: '概览', link: '/components/variables' },
            { 
              title: 'VariableInput', 
              children: [
                { title: '基础用法', link: '/components/variables/variable-input' },
                { title: '筛选条件', link: '/components/variables/variable-input/scenarios/filter' },
                { title: '联动规则', link: '/components/variables/variable-input/scenarios/linkage-rule' },
                { title: '字段赋值', link: '/components/variables/variable-input/scenarios/assign-fields-value' },
                { title: '数据范围', link: '/components/variables/variable-input/scenarios/data-scope' },
              ],
            },
            { title: 'SlateVariableEditor', link: '/components/variables/slate-variable-editor' },
          ],
        },
      ],
      '/examples': [
        {
          title: 'FlowModel',
          type: 'group',
          children: [
            {
              title: 'Hello，NocoBase',
              link: '/examples/flow-models/hello-world',
            },
            {
              title: 'AddSubModelButton',
              link: '/examples/flow-models/sub-model',
            },
            {
              title: 'Load model',
              link: '/examples/flow-models/load-model',
            },
            {
              title: 'Fork model',
              link: '/examples/flow-models/fork-model',
            },
            {
              title: '拖拽（DND）',
              link: '/examples/flow-models/dnd',
            },
            {
              title: '可配置的卡片',
              link: '/examples/flow-models/my-card',
            },
            {
              title: 'Vditor 集成',
              link: '/examples/flow-models/vditor',
            },
            {
              title: 'Markdown 解析',
              link: '/examples/flow-models/markdown',
            },
            {
              title: 'LiquidJS 集成',
              link: '/examples/flow-models/liquidjs',
            },
            {
              title: 'CRUD',
              link: '/examples/flow-models/crud',
            },
            {
              title: '生命周期',
              link: '/examples/flow-models/lifecycle',
            },
          ],
        },
        {
          title: 'FlowDefinition',
          type: 'group',
          children: [
            {
              title: '属性流',
              link: '/examples/flow-definition/props-flow',
            },
            {
              title: '事件流',
              link: '/examples/flow-definition/event-flow',
            },
            {
              title: 'Context（运行时）',
              link: '/examples/flow-definition/context-runtime',
            },
            {
              title: 'Context（配置态）',
              link: '/examples/flow-definition/context-settings',
            },
            {
              title: 'uiSchema - 步骤配置表单',
              link: '/examples/flow-definition/ui-schema-basic',
            },
            {
              title: '自定义组件（配置表单）',
              link: '/examples/flow-definition/ui-schema-custom-component',
            },
            {
              title: 'defaultParams - 步骤参数默认值',
              link: '/examples/flow-definition/default-params',
            },
            {
              title: 'beforeParamsSave - 步骤参数保存前',
              link: '/examples/flow-definition/before-params-save',
            },
            {
              title: 'afterParamsSave - 步骤参数保存后',
              link: '/examples/flow-definition/after-params-save',
            },
            {
              title: 'handler - 步骤处理函数',
              link: '/examples/flow-definition/handler',
            },
            {
              title: 'preset - 预设置的配置步骤',
              link: '/examples/flow-definition/preset',
            },
            {
              title: 'hideInSettings - 在设置界面中隐藏',
              link: '/examples/flow-definition/hide-in-settings',
            },
            {
              title: 'uiMode - 步骤设置的 UI 模式',
              link: '/examples/flow-definition/ui-mode',
            },
            {
              title: '打开预设置的配置表单',
              link: '/examples/flow-definition/open-preset-step-settings-dialog',
            },
            {
              title: '打开流配置表单',
              link: '/examples/flow-definition/open-settings',
            },
          ]
        },
        {
          title: 'FlowAction',
          type: 'group',
          children: [
            {
              title: 'FlowAction 示例',
              link: '/examples/flow-actions/example',
            },
          ],
        },
        {
          title: 'FlowContext',
          type: 'group',
          children: [
            {
              title: 'ctx.defineProperty() - 定义属性',
              link: '/examples/flow-context/define-property',
            },
            {
              title: 'ctx.defineMethod() - 定义方法',
              link: '/examples/flow-context/define-method',
            },
            {
              title: 'ctx.addDelegate() - 代理链',
              link: '/examples/flow-context/add-delegate',
            },
            {
              title: '异步 ctx 属性的 loading 状态',
              link: '/examples/flow-context/loading',
            },
            {
              title: 'ctx.model',
              link: '/examples/flow-context/model',
            },
            {
              title: 'ctx.ref + ctx.onRefReady',
              link: '/examples/flow-context/ref',
            },
            {
              title: 'ctx.renderJson',
              link: '/examples/flow-context/render-json',
            },
            {
              title: 'ctx.requirejs',
              link: '/examples/flow-context/requirejs',
            },
            {
              title: 'ctx.requireAsync',
              link: '/examples/flow-context/require-async',
            },
            {
              title: 'ctx.runjs',
              link: '/examples/flow-context/runjs',
            },
            {
              title: 'ctx.sql',
              link: '/examples/flow-context/sql',
            },
            {
              title: 'ctx.t',
              link: '/examples/flow-context/t',
            },
            {
              title: 'ctx.i18n',
              link: '/examples/flow-context/i18n',
            },
            {
              title: 'ctx.api',
              link: '/examples/flow-context/api',
            },
            {
              title: 'ctx.useResource()',
              link: '/examples/flow-context/use-resource',
            },
            {
              title: 'ctx.viewer',
              link: '/examples/flow-context/viewer',
            },
            {
              title: 'ctx.view',
              link: '/examples/flow-context/view',
            },
            {
              title: 'ctx.filterManager',
              link: '/examples/flow-context/filter-manager',
            },
            {
              title: 'ctx.app',
              link: '/examples/flow-context/app',
            },
            {
              title: 'ctx.engine',
              link: '/examples/flow-context/engine',
            },
            {
              title: 'ctx.router',
              link: '/examples/flow-context/router',
            },
            {
              title: 'ctx.route',
              link: '/examples/flow-context/route',
            },
            {
              title: 'ctx.location',
              link: '/examples/flow-context/location',
            },
            {
              title: 'ctx.antd',
              link: '/examples/flow-context/antd',
            },
            {
              title: 'ctx.modal',
              link: '/examples/flow-context/modal',
            },
            {
              title: 'ctx.message',
              link: '/examples/flow-context/message',
            },
            {
              title: 'ctx.notification',
              link: '/examples/flow-context/notification',
            },
            {
              title: 'ctx.dataSourceManager',
              link: '/examples/flow-context/data-source-manager',
            },
            {
              title: 'ctx.dataSource',
              link: '/examples/flow-context/data-source',
            },
            {
              title: 'ctx.collection',
              link: '/examples/flow-context/collection',
            },
            {
              title: 'ctx.collectionField',
              link: '/examples/flow-context/collection-field',
            },
            {
              title: 'ctx.association',
              link: '/examples/flow-context/association',
            },
            {
              title: 'ctx.resource',
              link: '/examples/flow-context/resource',
            },
            {
              title: 'ctx.exit()',
              link: '/examples/flow-context/exit',
            },
          ],
        },
        {
          title: 'FlowResource',
          type: 'group',
          children: [
            {
              title: '简单的 Resource',
              link: '/examples/flow-resources/simple-resource',
            },
            {
              title: 'APIResource',
              link: '/examples/flow-resources/api-resource',
            },
            {
              title: 'SingleRecordResource',
              link: '/examples/flow-resources/single-record-resource',
            },
            {
              title: 'MultiRecordResource',
              link: '/examples/flow-resources/multi-record-resource',
            },
            {
              title: 'SQLResource',
              link: '/examples/flow-resources/sql-resource',
            },
          ],
        },
        {
          title: 'React Hooks',
          type: 'group',
          children: [
            {
              title: 'useFlowEngine',
              link: '/examples/hooks/use-flow-engine',
            },
            {
              title: 'useFlowContext',
              link: '/examples/hooks/use-flow-context',
            },
            {
              title: 'useFlowEngineContext',
              link: '/examples/hooks/use-flow-engine-context',
            },
            {
              title: 'useFlowModelContext',
              link: '/examples/hooks/use-flow-model-context',
            },
            {
              title: 'useFlowSettingsContext',
              link: '/examples/hooks/use-flow-settings-context',
            },
            {
              title: 'useFlowViewContext',
              link: '/examples/hooks/use-flow-view-context',
            },
          ],
        },
        {
          title: '单元测试',
          type: 'group',
          children: [
            {
              title: 'FlowModel 测试',
              link: '/examples/tests/flow-model-test',
            },
            {
              title: '流测试',
              link: '/examples/tests/flow-test',
            },
          ],
        }
      ],
      '/learn': [
        {
          title: 'Quick start',
          type: 'group',
          children: [
            {
              title: '构建可编排的按钮组件',
              link: '/learn',
            },
            // {
            //   title: '构建可编排的卡片组件',
            //   link: '/learn/my-card',
            // },
          ],
        },
        {
          title: 'Basic',
          type: 'group',
          children: [
            {
              title: 'FlowModel',
              link: '/learn/flow-model',
            },
            {
              title: 'Observable',
              link: '/learn/observable',
            },
            {
              title: 'Define Collection',
              link: '/learn/define-collection',
            },
          ],
        },
        {
          title: '最佳实践',
          type: 'group',
          children: [
            {
              title: 'FlowModel 使用指南',
              link: '/learn/best-practices/flow-model',
            },
            {
              title: '1.0 vs 2.0',
              link: '/learn/best-practices/1-0-vs-2-0',
            }
          ]
        }
      ],
      '/models': [
        {
          title: '区块',
          type: 'group',
          children: [
            {
              title: 'FormBlockModel',
              link: '/models/blocks/form-block-model',
            },
            {
              title: 'DetailsBlockModel',
              link: '/models/blocks/details-block-model',
            },
            {
              title: 'TableBlockModel',
              link: '/models/blocks/table-block-model',
            },
          ],
        },
        {
          title: '过滤器',
          type: 'group',
          children: [
            {
              title: 'FormFilterModel',
              link: '/models/filters/form-filter-model',
            },
          ],
        },
        {
          title: '字段',
          type: 'group',
          children: [
            {
              title: 'SubFormFieldModel',
              link: '/models/fields/sub-form-field-model',
            },
            {
              title: 'SubTableFieldModel',
              link: '/models/fields/sub-table-field-model',
            },
            {
              title: 'DisplayFieldModel',
              link: '/models/fields/display-field-model',
            },
            {
              title: 'DisplayDateFieldModel',
              link: '/models/fields/display-date-field-model',
            },
            {
              title: 'DisplayNumberFieldModel',
              link: '/models/fields/display-number-field-model',
            },
            {
              title: 'InputFieldModel',
              link: '/models/fields/input-field-model',
            },
            {
              title: 'InputNumberFieldModel',
              link: '/models/fields/input-number-field-model',
            },
            {
              title: 'PreviewFieldModel',
              link: '/models/fields/preview-field-model',
            },
            {
              title: 'UploadFieldModel',
              link: '/models/fields/upload-field-model',
            },
          ],
        },
        {
          title: '操作',
          type: 'group',
          children: [
            // 暂无 actions 子项
          ],
        },
      ],
      '/api': [
        {
          type: 'group',
          title: 'Flow Engine',
          children: [
            {
              title: 'Overview',
              link: '/api/flow-engine',
            },
            {
              title: 'FlowEngine',
              link: '/api/flow-engine/flow-engine',
            },
            {
              title: 'FlowContext',
              children: [
                {
                  title: 'Overview',
                  link: '/api/flow-engine/flow-context',
                },
                {
                  title: 'FlowContext',
                  link: '/api/flow-engine/flow-context/flow-context',
                },
                {
                  title: 'FlowEngineContext',
                  link: '/api/flow-engine/flow-context/flow-engine-context',
                },
                {
                  title: 'FlowModelContext',
                  link: '/api/flow-engine/flow-context/flow-model-context',
                },
                {
                  title: 'FlowRuntimeContext',
                  link: '/api/flow-engine/flow-context/flow-runtime-context',
                },
              ],
            },
            {
              title: 'FlowModel',
              children: [
                {
                  title: 'Overview',
                  link: '/api/flow-engine/flow-model',
                },
                {
                  title: 'FlowModel',
                  link: '/api/flow-engine/flow-model/flow-model',
                },
                {
                  title: 'SubModel',
                  link: '/api/flow-engine/flow-model/sub-model',
                },
                {
                  title: 'ForkModel',
                  link: '/api/flow-engine/flow-model/fork-model',
                },
              ]
            },
            {
              title: 'FlowModelRenderer',
              link: '/api/flow-engine/flow-model-renderer',
            },
            {
              title: 'FlowModelRepository',
              link: '/api/flow-engine/flow-model-repository',
            },
            {
              title: 'FlowDefinition',
              link: '/api/flow-engine/flow-definition',
            },
            {
              title: 'FlowAction',
              link: '/api/flow-engine/flow-action',
            },
            {
              title: 'FlowResource',
              children: [
                {
                  title: 'Overview',
                  link: '/api/flow-engine/flow-resource',
                },
                {
                  title: 'APIResource',
                  link: '/api/flow-engine/flow-resource/api-resource',
                },
                {
                  title: 'SingleRecordResource',
                  link: '/api/flow-engine/flow-resource/single-record-resource',
                },
                {
                  title: 'MultiRecordResource',
                  link: '/api/flow-engine/flow-resource/multi-record-resource',
                },
                {
                  title: 'SQLResource',
                  link: '/api/flow-engine/flow-resource/sql-resource',
                },
              ],
            },
            {
              title: 'FlowSettings',
              link: '/api/flow-engine/flow-settings',
            },
            {
              title: 'FlowSQLRepository',
              link: '/api/flow-engine/flow-sql-repository',
            },
          ]
        }
      ],
      // '/core': [
      //   // {
      //   //   title: 'Application',
      //   //   type: 'group',
      //   //   children: [
      //   //     {
      //   //       title: 'Application',
      //   //       link: '/core/application/application',
      //   //     },
      //   //     {
      //   //       title: 'PluginManager',
      //   //       link: '/core/application/plugin-manager',
      //   //     },
      //   //     {
      //   //       title: 'RouterManager',
      //   //       link: '/core/application/router-manager',
      //   //     },
      //   //     {
      //   //       title: 'PluginSettingsManager',
      //   //       link: '/core/application/plugin-settings-manager',
      //   //     },
      //   //     {
      //   //       title: 'Request',
      //   //       link: '/core/request',
      //   //     },
      //   //   ],
      //   // },
      //   {
      //     title: 'Quickstart',
      //     link: '/core/flow-models/quickstart',
      //   },
      //   {
      //     title: 'FlowEngine',
      //     type: 'group',
      //     children: [
      //       {
      //         title: 'Overview',
      //         link: '/core/flow-engine',
      //       },
      //       {
      //         title: 'FlowEngine',
      //         link: '/core/flow-engine/flow-engine',
      //       },
      //       {
      //         title: 'FlowModelRepository',
      //         link: '/core/flow-engine/flow-model-repository',
      //       },
      //       {
      //         title: 'FlowModel',
      //         link: '/core/flow-engine/flow-model',
      //       },
      //       {
      //         title: 'FlowSubModel',
      //         link: '/core/flow-engine/flow-sub-model',
      //       },
      //       {
      //         title: 'FlowModelRenderer',
      //         link: '/core/flow-engine/flow-model-renderer',
      //       },
      //       {
      //         title: 'FlowModelSettings',
      //         link: '/core/flow-engine/flow-model-settings',
      //       },
      //       {
      //         title: 'FlowDefinition',
      //         link: '/core/flow-engine/flow-definition',
      //       },
      //       {
      //         title: 'FlowResource',
      //         link: '/core/flow-engine/flow-resource',
      //       },
      //       {
      //         title: 'FlowContext',
      //         children: [
      //           {
      //             title: 'Overview',
      //             link: '/core/flow-engine/flow-context',
      //           },
      //           {
      //             title: 'FlowContext',
      //             link: '/core/flow-engine/flow-context/flow-context',
      //           },
      //           {
      //             title: 'FlowEngineContext',
      //             link: '/core/flow-engine/flow-context/flow-engine-context',
      //           },
      //           {
      //             title: 'FlowModelContext',
      //             link: '/core/flow-engine/flow-context/flow-model-context',
      //           },
      //           {
      //             title: 'FlowRuntimeContext',
      //             link: '/core/flow-engine/flow-context/flow-runtime-context',
      //           },
      //         ],
      //       },
      //       {
      //         title: 'FlowAction',
      //         link: '/core/flow-engine/flow-action',
      //       },
      //       {
      //         title: 'FlowHooks',
      //         link: '/core/flow-engine/flow-hooks',
      //       },
      //     ],
      //   },
      //   {
      //     title: 'Flow Models',
      //     type: 'group',
      //     children: [
      //       {
      //         title: 'Overview',
      //         link: '/core/flow-models',
      //       },
      //       {
      //         title: 'LayoutModel',
      //         link: '/core/flow-models/layout-flow-model',
      //       },
      //       {
      //         title: 'LayoutRouteModel',
      //         link: '/core/flow-models/layout-route-flow-model',
      //       },
      //       {
      //         title: 'PageModel',
      //         link: '/core/flow-models/page-flow-model',
      //       },
      //       {
      //         title: 'PageTabModel',
      //         link: '/core/flow-models/page-tab-flow-model',
      //       },
      //       {
      //         title: 'GridModel',
      //         link: '/core/flow-models/grid-flow-model',
      //       },
      //       {
      //         title: 'BlockGridModel',
      //         link: '/core/flow-models/block-grid-flow-model',
      //       },
      //       {
      //         title: 'BlockModel',
      //         link: '/core/flow-models/block-flow-model',
      //       },
      //       {
      //         title: 'FormModel',
      //         link: '/core/flow-models/form-flow-model',
      //       },
      //       {
      //         title: 'TableModel',
      //         link: '/core/flow-models/table-flow-model',
      //       },
      //       {
      //         title: 'DetailsModel',
      //         link: '/core/flow-models/details-flow-model',
      //       },
      //       {
      //         title: 'ListModel',
      //         link: '/core/flow-models/list-flow-model',
      //       },
      //       {
      //         title: 'CalendarModel',
      //         link: '/core/flow-models/calendar-flow-model',
      //       },

      //       {
      //         title: 'KanbanModel',
      //         link: '/core/flow-models/kanban-flow-model',
      //       },
      //       {
      //         title: 'MapModel',
      //         link: '/core/flow-models/map-flow-model',
      //       },
      //       {
      //         title: 'GanttModel',
      //         link: '/core/flow-models/gantt-flow-model',
      //       },
      //       {
      //         title: 'ChartModel',
      //         link: '/core/flow-models/chart-flow-model',
      //       },
      //       {
      //         title: 'MarkdownModel',
      //         link: '/core/flow-models/markdown-flow-model',
      //       },
      //       {
      //         title: 'HtmlModel',
      //         link: '/core/flow-models/html-flow-model',
      //       },
      //       {
      //         title: 'iframeModel',
      //         link: '/core/flow-models/iframe-flow-model',
      //       },
      //       {
      //         title: 'TimelineModel',
      //         link: '/core/flow-models/timeline-flow-model',
      //       },
      //       {
      //         title: 'CollapseModel',
      //         link: '/core/flow-models/collapse-flow-model',
      //       },
      //     ],
      //   },
      //   {
      //     title: 'Flow Actions',
      //     type: 'group',
      //     children: [
      //       {
      //         title: 'Overview',
      //         link: '/core/flow-actions',
      //       },
      //     ],
      //   },
      // ],
      // '/components': [
      //   {
      //     title: 'Action',
      //     type: 'group',
      //     children: [
      //       {
      //         "title": "Action",
      //         "link": "/components/action"
      //       },
      //       {
      //         "title": "Filter",
      //         "link": "/components/filter"
      //       },
      //       {
      //         "title": "LinkageFilter",
      //         "link": "/components/linkage-filter"
      //       },
      //     ]
      //   },
      //   {
      //     title: 'Field',
      //     type: 'group',
      //     children: [
      //       {
      //         "title": "Checkbox",
      //         "link": "/components/checkbox"
      //       },
      //       {
      //         "title": "Cascader",
      //         "link": "/components/cascader"
      //       },
      //       {
      //         "title": "ColorPicker",
      //         "link": "/components/color-picker"
      //       },
      //       {
      //         "title": "ColorSelect",
      //         "link": "/components/color-select"
      //       },
      //       {
      //         "title": "DatePicker",
      //         "link": "/components/date-picker"
      //       },
      //       {
      //         "title": "TimePicker",
      //         "link": "/components/time-picker"
      //       },
      //       {
      //         "title": "IconPicker",
      //         "link": "/components/icon-picker"
      //       },
      //       {
      //         "title": "InputNumber",
      //         "link": "/components/input-number"
      //       },
      //       {
      //         "title": "Input",
      //         "link": "/components/input"
      //       },
      //       {
      //         "title": "AutoComplete",
      //         "link": "/components/auto-complete"
      //       },
      //       {
      //         "title": "NanoIDInput",
      //         "link": "/components/nanoid-input"
      //       },
      //       {
      //         "title": "Password",
      //         "link": "/components/password"
      //       },
      //       {
      //         "title": "Percent",
      //         "link": "/components/percent"
      //       },
      //       {
      //         "title": "Radio",
      //         "link": "/components/radio"
      //       },
      //       {
      //         "title": "Select",
      //         "link": "/components/select"
      //       },
      //       {
      //         "title": "RemoteSelect",
      //         "link": "/components/remote-select"
      //       },
      //       {
      //         "title": "TreeSelect",
      //         "link": "/components/tree-select"
      //       },
      //       {
      //         "title": "Upload",
      //         "link": "/components/upload"
      //       },
      //       {
      //         "title": "CollectionSelect",
      //         "link": "/components/collection-select"
      //       },
      //       {
      //         "title": "Cron",
      //         "link": "/components/cron"
      //       },
      //       {
      //         "title": "Markdown",
      //         "link": "/components/markdown"
      //       },
      //       {
      //         "title": "Variable",
      //         "link": "/components/variable"
      //       },
      //       {
      //         "title": "QuickEdit",
      //         "link": "/components/quick-edit"
      //       },
      //       {
      //         "title": "RichText",
      //         "link": "/components/rich-text"
      //       }
      //     ]
      //   },
      //   {
      //     title: 'Block',
      //     type: 'group',
      //     children: [
      //       {
      //         "title": "BlockItem",
      //         "link": "/components/block-item"
      //       },
      //       {
      //         "title": "CardItem",
      //         "link": "/components/card-item"
      //       },
      //       {
      //         "title": "FormItem",
      //         "link": "/components/form-item"
      //       },
      //       {
      //         "title": "FormV2",
      //         "link": "/components/form-v2"
      //       },
      //       {
      //         "title": "TableV2",
      //         "link": "/components/table-v2"
      //       },
      //       {
      //         "title": "Details",
      //         "link": "/components/details"
      //       },
      //       {
      //         "title": "GridCard",
      //         "link": "/components/grid-card"
      //       },
      //       {
      //         "title": "Grid",
      //         "link": "/components/grid"
      //       },
      //       {
      //         "title": "List",
      //         "link": "/components/list"
      //       },
      //     ]
      //   },
      //   {
      //     title: 'Others',
      //     type: 'group',
      //     children: [
      //       {
      //         "title": "Tabs",
      //         "link": "/components/tabs"
      //       },
      //       {
      //         "title": "ErrorFallback",
      //         "link": "/components/error-fallback"
      //       },
      //       {
      //         "title": "G2Plot",
      //         "link": "/components/g2plot"
      //       },
      //       {
      //         "title": "Menu",
      //         "link": "/components/menu"
      //       },
      //       {
      //         "title": "Pagination",
      //         "link": "/components/pagination"
      //       },
      //     ]
      //   },
      // ]
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
