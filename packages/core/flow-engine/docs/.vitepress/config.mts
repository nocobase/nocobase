import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Flow Engine",
  description: "NocoBase 2.0 全新的前端无代码、低代码开发引擎",
  cleanUrls: true,
  themeConfig: {
    outline: { level: 'deep' },
    siteTitle: false,
    logo: 'https://static-docs.nocobase.com/logo-nocobase.png',
    // https://vitepress.dev/reference/default-theme-config

    nav: [
      { text: 'Guide', link: '/guide/what-is-flow-engine' },
      { text: 'API', link: '/api/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '简介',
          items: [
            { text: '什么是 FlowEngine？', link: '/guide/what-is-flow-engine' },
            { text: 'FlowEngine 与插件的关系', link: '/guide/flow-engine-and-plugins' },
            { text: '快速开始', link: '/guide/quickstart' },
          ]
        },
        {
          text: '指南',
          items: [
            {
              text: '注册 FlowModel',
              link: '/guide/register-flow-model'
            },
            {
              text: '创建 FlowModel',
              link: '/guide/create-flow-model'
            },
            {
              text: '渲染 FlowModel',
              link: '/guide/flow-model-renderer'
            },
            {
              text: 'FlowModel 事件流与配置化',
              link: '/guide/flow-model-settings'
            },
            {
              text: 'FlowModel 持久化',
              link: '/guide/flow-model-repository'
            },
            {
              text: 'FlowModel 生命周期',
              link: '/guide/flow-model-lifecycle'
            },
            {
              text: 'FlowModel 的上下文体系',
              link: '/guide/flow-context'
            },
            {
              text: '响应式机制：Observable',
              link: '/guide/observable'
            },
            {
              text: 'FlowModel vs React.Component',
              link: '/guide/flow-model-vs-react-component'
            },
          ]
        },
        {
          text: 'Definitions',
          items: [
            { text: 'ModelDefinition', link: '/guide/definitions/model-definition' },
            { text: 'FlowDefinition', link: '/guide/definitions/flow-definition' },
            { text: 'EventDefinition', link: '/guide/definitions/event-definition' },
            { text: 'ActionDefinition', link: '/guide/definitions/action-definition' },
            { text: 'StepDefinition', link: '/guide/definitions/step-definition' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API',
          items: [
            { text: '概述', link: '/api/' },
            { text: 'FlowEngine', link: '/api/flow-engine' },
            { text: 'Flow', link: '/api/flow' },
            { text: 'Node', link: '/api/node' },
            { text: 'Edge', link: '/api/edge' },
            { text: 'Context', link: '/api/context' },
            { text: 'Task', link: '/api/task' },
          ]
        }
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
