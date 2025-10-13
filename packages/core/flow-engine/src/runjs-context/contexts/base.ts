/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export function defineBaseContextMeta() {
  FlowRunJSContext.define({
    label: 'RunJS base',
    properties: {
      logger: 'Pino logger instance for structured logging. Example: `ctx.logger.info({ foo: 1 }, "message")`',
      message:
        'Ant Design global message API for displaying temporary messages. Example: `ctx.message.success("Operation completed")`',
      notification:
        'Ant Design notification API for displaying notification boxes. Example: `ctx.notification.open({ message: "Title", description: "Content" })`',
      resource: 'Data resource accessible based on current user permissions',
      urlSearchParams: 'URLSearchParams object containing query parameters from the current URL',
      token: 'API authentication token for the current session',
      role: 'Current user role information',
      auth: 'Authentication context containing locale, role, user, and token information',
      api: {
        description: 'APIClient instance for making HTTP requests.',
        detail: 'APIClient',
        properties: {
          request: {
            description:
              'Make an HTTP request using the APIClient instance. Parameters: (options: RequestOptions) => Promise<any>.',
            detail: 'Promise<any>',
            completion: {
              insertText: `await ctx.api.request({ url: '', method: 'get', params: {} })`,
            },
          },
        },
      },
      i18n: {
        description: 'An instance of i18next for managing internationalization.',
        detail: 'i18next',
        properties: {
          language: 'Current active language code.',
        },
      },
      React: 'React namespace providing React library functions and hooks (available in RunJS environment)',
      ReactDOM: 'ReactDOM client API including createRoot for rendering React components',
      antd: 'Ant Design component library',
    },
    methods: {
      t: 'Internationalization function for translating text. Parameters: (key: string, variables?: object) => string. Example: `ctx.t("Hello {name}", { name: "World" })`',
      requireAsync:
        'Asynchronously load external libraries from URL. Parameters: (url: string) => Promise<any>. Example: `const lodash = await ctx.requireAsync("https://cdn.jsdelivr.net/npm/lodash")`',
      importAsync:
        'Dynamically import ESM module by URL. Parameters: (url: string) => Promise<Module>. Example: `const mod = await ctx.importAsync("https://cdn.jsdelivr.net/npm/lit-html@2/+esm")`',
      resolveJsonTemplate:
        'Resolve JSON templates containing variable expressions with {{ }} syntax. Parameters: (template: any, context?: object) => any',
      runAction: {
        description:
          'Execute a data action on the current resource. Parameters: (actionName: string, params: object) => Promise<any>. Example: `await ctx.runAction("create", { values: { name: "test" } })`',
        detail: 'Promise<any>',
        completion: {
          insertText: `await ctx.runAction('create', { values: {} })`,
        },
      },
      openView: {
        description: `Open a view component (page, modal, or drawer) by its unique identifier.
      Parameters: (viewId: string, options?: OpenViewOptions) => Promise<void>
      Options:
        - params: Record<string, any> - Parameters passed to the view component
        - mode: "page" | "modal" | "drawer" - Display mode (default: "drawer")
        - title: string - Modal/drawer title
        - width: number | string - Modal/drawer width
        - navigation: boolean - Whether to use route navigation
        - preventClose: boolean - Prevent closing the view
        - viewUid: string - Custom view UID for routing
        - isMobileLayout: boolean - Use mobile layout (displays as embed)
      Examples:
       - Modal with params: await ctx.openView("user-detail", { params: { id: 123 }, mode: "modal", title: "User Details", width: 800 })
       - Drawer (default): await ctx.openView("settings-page")
        - Page navigation: await ctx.openView("dashboard", { mode: "page" })`,
        detail: 'Promise<void>',
        completion: {
          insertText: `await ctx.openView('view-id', { mode: 'drawer', params: {} })`,
        },
      },
    },
  });

  FlowRunJSContext.define(
    {
      label: 'RunJS 基础',
      properties: {
        logger: 'Pino 日志实例（结构化日志）。示例：`ctx.logger.info({ foo: 1 }, "message")`',
        message: 'Ant Design 全局消息 API，用于显示临时提示。示例：`ctx.message.success("操作成功")`',
        notification:
          'Ant Design 通知 API，用于显示通知框。示例：`ctx.notification.open({ message: "标题", description: "内容" })`',
        resource: '基于当前用户权限可访问的数据资源',
        urlSearchParams: '当前 URL 的查询参数（URLSearchParams 对象）',
        token: '当前会话的 API 认证 token',
        role: '当前用户角色信息',
        auth: '认证上下文，包含 locale、role、user、token 等信息',
        api: {
          description: '用于发起 HTTP 请求的 APIClient 实例',
          detail: 'APIClient',
          properties: {
            request: {
              description: '通过 ctx.api.request 发起 HTTP 请求，入参为 RequestOptions，返回 Promise。',
              detail: 'Promise<any>',
              completion: {
                insertText: `await ctx.api.request({ url: '', method: 'get', params: {} })`,
              },
            },
          },
        },
        i18n: {
          description: 'i18next 实例，可用于管理国际化',
          detail: 'i18next',
          properties: {
            language: '当前激活的语言代码',
          },
        },
        React: 'React 命名空间，提供 React 函数与 hooks（RunJS 环境中可用）',
        ReactDOM: 'ReactDOM 客户端 API，含 createRoot 等渲染方法',
        antd: 'Ant Design 组件库（RunJS 环境中可用）',
      },
      methods: {
        t: '国际化函数，用于翻译文案。参数：(key: string, variables?: object) => string。示例：`ctx.t("你好 {name}", { name: "世界" })`',
        requireAsync:
          '按 URL 异步加载外部库。参数：(url: string) => Promise<any>。示例：`const lodash = await ctx.requireAsync("https://cdn.jsdelivr.net/npm/lodash")`',
        importAsync:
          '按 URL 动态导入 ESM 模块（开发/生产均可用）。参数：(url: string) => Promise<Module>。示例：`const mod = await ctx.importAsync("https://cdn.jsdelivr.net/npm/lit-html@2/+esm")`',
        resolveJsonTemplate: '解析含 {{ }} 变量表达式的 JSON 模板。参数：(template: any, context?: object) => any',
        runAction: {
          description:
            '对当前资源执行数据动作。参数：(actionName: string, params: object) => Promise<any>。示例：`await ctx.runAction("create", { values: { name: "test" } })`',
          detail: 'Promise<any>',
          completion: {
            insertText: `await ctx.runAction('create', { values: {} })`,
          },
        },
        openView: {
          description:
            '根据唯一标识打开视图（页面/弹窗/抽屉）。参数：(viewId: string, options?: OpenViewOptions) => Promise<void>`，常用选项：params、mode、title、width、navigation、preventClose、viewUid、isMobileLayout。',
          detail: 'Promise<void>',
          completion: {
            insertText: `await ctx.openView('view-id', { mode: 'drawer', params: {} })`,
          },
        },
      },
    },
    { locale: 'zh-CN' },
  );
}
