/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

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
    api: 'APIClient instance for making API requests to NocoBase server',
    React: 'React namespace providing React library functions and hooks (available in RunJS environment)',
    ReactDOM: 'ReactDOM client API including createRoot for rendering React components',
    antd: 'Ant Design component library',
  },
  methods: {
    t: 'Internationalization function for translating text. Parameters: (key: string, variables?: object) => string. Example: `ctx.t("Hello {name}", { name: "World" })`',
    requireAsync:
      'Asynchronously load external libraries from URL. Parameters: (url: string) => Promise<any>. Example: `const lodash = await ctx.requireAsync("https://cdn.jsdelivr.net/npm/lodash")`',
    resolveJsonTemplate:
      'Resolve JSON templates containing variable expressions with {{ }} syntax. Parameters: (template: any, context?: object) => any',
    runAction:
      'Execute a data action on the current resource. Parameters: (actionName: string, params: object) => Promise<any>. Example: `await ctx.runAction("create", { values: { name: "test" } })`',
    openView: `Open a view component (page, modal, or drawer) by its unique identifier.
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
  },
});
