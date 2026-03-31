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
      message: {
        description: 'Ant Design global message API for displaying temporary messages.',
        detail: 'MessageInstance',
        hidden: (ctx: any) => !(ctx as any)?.message,
        examples: ['ctx.message.success("Operation completed")'],
        properties: {
          info: {
            type: 'function',
            description: 'Show an info message.',
            detail: '(content: any, duration?: number) => void',
            completion: { insertText: `ctx.message.info('Info')` },
          },
          success: {
            type: 'function',
            description: 'Show a success message.',
            detail: '(content: any, duration?: number) => void',
            completion: { insertText: `ctx.message.success('Success')` },
          },
          error: {
            type: 'function',
            description: 'Show an error message.',
            detail: '(content: any, duration?: number) => void',
            completion: { insertText: `ctx.message.error('Error')` },
          },
          warning: {
            type: 'function',
            description: 'Show a warning message.',
            detail: '(content: any, duration?: number) => void',
            completion: { insertText: `ctx.message.warning('Warning')` },
          },
          loading: {
            type: 'function',
            description: 'Show a loading message.',
            detail: '(content: any, duration?: number) => void',
            completion: { insertText: `ctx.message.loading('Loading...')` },
          },
          open: {
            type: 'function',
            description: 'Open a message with custom config.',
            detail: '(config: any) => void',
            completion: { insertText: `ctx.message.open({ type: 'info', content: 'Hello' })` },
          },
          destroy: {
            type: 'function',
            description: 'Destroy all messages.',
            detail: '() => void',
            completion: { insertText: `ctx.message.destroy()` },
          },
        },
      },
      notification: {
        description: 'Ant Design notification API for displaying notification boxes.',
        detail: 'NotificationInstance',
        hidden: (ctx: any) => !(ctx as any)?.notification,
        examples: ['ctx.notification.open({ message: "Title", description: "Content" })'],
        properties: {
          open: {
            type: 'function',
            description: 'Open a notification with config.',
            detail: '(config: any) => void',
            completion: { insertText: `ctx.notification.open({ message: 'Title', description: 'Content' })` },
          },
          success: {
            type: 'function',
            description: 'Open a success notification.',
            detail: '(config: any) => void',
            completion: { insertText: `ctx.notification.success({ message: 'Success' })` },
          },
          info: {
            type: 'function',
            description: 'Open an info notification.',
            detail: '(config: any) => void',
            completion: { insertText: `ctx.notification.info({ message: 'Info' })` },
          },
          warning: {
            type: 'function',
            description: 'Open a warning notification.',
            detail: '(config: any) => void',
            completion: { insertText: `ctx.notification.warning({ message: 'Warning' })` },
          },
          error: {
            type: 'function',
            description: 'Open an error notification.',
            detail: '(config: any) => void',
            completion: { insertText: `ctx.notification.error({ message: 'Error' })` },
          },
          destroy: {
            type: 'function',
            description: 'Destroy all notifications.',
            detail: '(key?: string) => void',
            completion: { insertText: `ctx.notification.destroy()` },
          },
        },
      },
      modal: {
        description: 'Ant Design modal API (HookAPI) for opening modal dialogs.',
        detail: 'HookAPI',
        hidden: (ctx: any) => !(ctx as any)?.modal,
        examples: [`ctx.modal.confirm({ title: 'Confirm', content: 'Are you sure?' })`],
        properties: {
          info: {
            type: 'function',
            description: 'Open an info modal.',
            detail: '(config: any) => void',
            completion: { insertText: `ctx.modal.info({ title: 'Info', content: '...' })` },
          },
          success: {
            type: 'function',
            description: 'Open a success modal.',
            detail: '(config: any) => void',
            completion: { insertText: `ctx.modal.success({ title: 'Success', content: '...' })` },
          },
          error: {
            type: 'function',
            description: 'Open an error modal.',
            detail: '(config: any) => void',
            completion: { insertText: `ctx.modal.error({ title: 'Error', content: '...' })` },
          },
          warning: {
            type: 'function',
            description: 'Open a warning modal.',
            detail: '(config: any) => void',
            completion: { insertText: `ctx.modal.warning({ title: 'Warning', content: '...' })` },
          },
          confirm: {
            type: 'function',
            description: 'Open a confirm modal.',
            detail: '(config: any) => void',
            completion: { insertText: `ctx.modal.confirm({ title: 'Confirm', content: '...' })` },
          },
        },
      },
      // TODO: context meta
      resource: {
        description:
          'The current FlowResource instance in this context, used to access and manipulate data. In most block/popup scenarios it is pre-bound by the runtime (no need to call ctx.initResource). In contexts like plain JS blocks where no resource is bound, you can call ctx.initResource(type) first and then use ctx.resource.',
        detail: 'FlowResource',
        examples: ['await ctx.resource.refresh();'],
        properties: {
          // FlowResource
          getData: {
            description: 'Get current resource data.',
            detail: '() => any',
            completion: { insertText: 'ctx.resource.getData()' },
          },
          setData: {
            description: 'Set current resource data (client-side only).',
            detail: '(value: any) => this',
            completion: { insertText: 'ctx.resource.setData(value)' },
          },
          refresh: {
            description: 'Refresh data from server (available on API-backed resources).',
            detail: '() => Promise<any>',
            completion: { insertText: 'await ctx.resource.refresh()' },
          },
          on: {
            description: 'Subscribe resource events (e.g., refresh).',
            detail: '(event: string, callback: (...args) => void) => void',
            completion: { insertText: "ctx.resource.on('refresh', () => {})" },
          },
          off: {
            description: 'Unsubscribe resource events.',
            detail: '(event: string, callback: (...args) => void) => void',
            completion: { insertText: "ctx.resource.off('refresh', handler)" },
          },
          // BaseRecordResource / SingleRecordResource / MultiRecordResource helpers (common)
          setResourceName: {
            description: 'Set resource name (e.g., "users" or "users.profile").',
            detail: '(resourceName: string) => this',
            completion: { insertText: "ctx.resource.setResourceName('users')" },
          },
          setFilterByTk: {
            description: 'Set primary key or filterByTk for record resources.',
            detail: '(filterByTk: any) => this',
            completion: { insertText: 'ctx.resource.setFilterByTk(filterByTk)' },
          },
          runAction: {
            description: 'Run a resource action (create/update/destroy/custom actions).',
            detail: '(action: string, options: any) => Promise<any>',
            completion: { insertText: "await ctx.resource.runAction('create', { data: {} })" },
          },
          selectedRows: {
            description:
              'Selected rows in table resources (typically for collection/table actions). Availability depends on resource type.',
            detail: 'any[]',
          },
          pagination: {
            description:
              'Pagination info in list resources. Availability depends on resource type (e.g., MultiRecordResource).',
            detail: 'Record<string, any>',
          },
        },
      },
      urlSearchParams: 'URLSearchParams object containing query parameters from the current URL',
      token: 'API authentication token for the current session',
      role: 'Current user role information',
      auth: {
        description: 'Authentication context containing locale, role, user, and token information.',
        detail: 'AuthContext',
        properties: {
          locale: 'Current locale code (e.g., "en-US", "zh-CN").',
          roleName: 'Current role name.',
          token: 'Current API token.',
          user: 'Current user info object (if available).',
        },
      },
      viewer: {
        description: 'FlowViewer instance providing view helpers (drawer/dialog/popover/embed). ',
        detail: 'FlowViewer',
        examples: [
          "await ctx.viewer.drawer({ width: '56%', content: <div>Hello</div> });",
          'await ctx.viewer.dialog({ content: <div>Confirm</div> });',
        ],
        properties: {
          drawer: {
            description: 'Open a drawer view. Parameters: (props: ViewProps) => any',
            detail: '(props) => any',
            completion: { insertText: "await ctx.viewer.drawer({ width: '56%', content: <div /> })" },
          },
          dialog: {
            description: 'Open a dialog/modal view. Parameters: (props: ViewProps) => any',
            detail: '(props) => any',
            completion: { insertText: 'await ctx.viewer.dialog({ content: <div /> })' },
          },
          popover: {
            description: 'Open a popover view. Parameters: (props: PopoverProps) => any',
            detail: '(props) => any',
            completion: { insertText: 'await ctx.viewer.popover({ target: ctx.element?.__el, content: <div /> })' },
          },
          embed: {
            description: 'Open an embed view. Parameters: (props: ViewProps & TargetProps) => any',
            detail: '(props) => any',
            completion: { insertText: 'await ctx.viewer.embed({ target: document.body, content: <div /> })' },
          },
        },
      },
      popup: {
        description:
          'Popup context when current view is opened as a popup/drawer. Recommended: `const popup = await ctx.getVar("ctx.popup")`.',
        detail: 'Promise<PopupContext | undefined>',
        hidden: async (ctx: any) => {
          try {
            const popup = await (ctx as any)?.popup;
            return !popup?.uid;
          } catch (_) {
            // Fail-open: if we cannot determine, do not hide.
            return false;
          }
        },
        examples: [
          'const popup = await ctx.getVar("ctx.popup");',
          'const id = popup?.record?.id;',
          'const parentId = popup?.parent?.record?.id;',
        ],
        properties: {
          uid: 'Popup view uid (string).',
          record: 'Current popup record (object).',
          sourceRecord: 'Parent/source record inferred from sourceId/associationName (object).',
          resource: {
            description: 'Data source info of the popup record.',
            detail: 'PopupResourceInfo',
            properties: {
              dataSourceKey: 'Data source key (e.g., "main").',
              collectionName: 'Collection name.',
              associationName: 'Association resource name (optional).',
              filterByTk: 'Record primary key / filterByTk.',
              sourceId: 'Source id (optional).',
            },
          },
          parent: 'Parent popup info (object). You can access parent.parent... at runtime if available.',
        },
      },
      i18n: {
        description: 'An instance of i18next for managing internationalization.',
        detail: 'i18next',
        properties: {
          language: 'Current active language code.',
        },
      },
      libs: {
        properties: {
          React: 'React namespace (same as ctx.React).',
          ReactDOM: 'ReactDOM client API (same as ctx.ReactDOM).',
          antd: 'Ant Design component library (same as ctx.antd).',
          dayjs: 'dayjs date-time utility library.',
          antdIcons: 'Ant Design icons library. Example: `ctx.libs.antdIcons.PlusOutlined`.',
          lodash: 'Lodash utility library. Example: `ctx.libs.lodash.get(obj, "a.b")`.',
          formula: 'Formula.js library (spreadsheet-like functions). Example: `ctx.libs.formula.SUM(1, 2, 3)`.',
          math: 'mathjs library. Example: `ctx.libs.math.evaluate("2 + 3")`.',
        },
      },
    },
    methods: {
      request: {
        description:
          'Make an HTTP request using the APIClient instance. Parameters: (options: RequestOptions) => Promise<any>.',
        detail: '(options: RequestOptions) => Promise<any>',
        completion: { insertText: `await ctx.request({ url: '', method: 'get', params: {} })` },
      },
      getModel: {
        description:
          'Get a model instance by uid. By default, it searches across the current view stack and returns the first matched model.',
        detail: '(uid: string, searchInPreviousEngines?: boolean) => FlowModel | undefined',
        completion: { insertText: `ctx.getModel('block-uid-xxx')` },
        params: [
          {
            name: 'uid',
            type: 'string',
            description: 'Target model uid.',
          },
          {
            name: 'searchInPreviousEngines',
            type: 'boolean',
            description: 'Whether to search in parent engines (default: false).',
          },
        ],
        returns: { type: 'FlowModel | undefined' },
        examples: ["const model = ctx.getModel('block-uid-xxx');"],
      },
      t: 'Internationalization function for translating text. Parameters: (key: string, variables?: object) => string. Example: `ctx.t("Hello {{name}}", { name: "World" })`',
      initResource: {
        description:
          'Initialize ctx.resource as a FlowResource instance by class name. Common values: "MultiRecordResource", "SingleRecordResource", "SQLResource".',
        detail: '(resourceType: ResourceType) => void',
        completion: { insertText: "ctx.initResource('MultiRecordResource')" },
        examples: ["ctx.initResource('MultiRecordResource'); ctx.resource.setResourceName('users');"],
      },
      makeResource: {
        description:
          'Create a new resource instance without binding it to ctx.resource. Useful when you need multiple independent or temporary resources. Common values: "MultiRecordResource", "SingleRecordResource", "SQLResource".',
        detail: '(resourceType) => FlowResource',
        completion: { insertText: "const resource = ctx.makeResource('SingleRecordResource')" },
        examples: ["const resource = ctx.makeResource('SingleRecordResource'); resource.setResourceName('users');"],
      },
      render: {
        description:
          'Render into container. Accepts ReactElement, DOM Node/Fragment, or HTML string. Parameters: (vnode: ReactElement | Node | DocumentFragment | string, container?: HTMLElement|ElementProxy) => Root|null. Example: `ctx.render(<div>Hello</div>)` or `ctx.render("<b>hi</b>")`',
        detail: 'ReactDOM Root',
        completion: {
          insertText: `ctx.render(<div />)`,
        },
      },
      requireAsync:
        'Load UMD/AMD/global scripts or CSS asynchronously from URL. Accepts shorthand like "echarts@5/dist/echarts.min.js" (resolved via ESM CDN with ?raw) or full URLs, and returns a Promise of the loaded library.',
      importAsync:
        'Dynamically import ESM modules or CSS by URL. Accepts shorthand like "vue@3.4.0" or "dayjs@1/plugin/relativeTime.js" (resolved via configured ESM CDN) or full URLs, and returns a Promise of the module namespace.',
      getVar: {
        description: 'Resolve a ctx expression value by path string (expression starts with "ctx.").',
        detail: '(path: string) => Promise<any>',
        completion: { insertText: "await ctx.getVar('ctx.record.id')" },
        params: [
          {
            name: 'path',
            type: 'string',
            description: 'Expression path starts with "ctx." (e.g. "ctx.record.id", "ctx.record.roles[0].id").',
          },
        ],
        returns: { type: 'Promise<any>' },
        examples: ["const id = await ctx.getVar('ctx.record.id');"],
      },
      getApiInfos: {
        description: 'All available APIs under context namespace',
        detail: '(options?: { version?: string }) => Promise<Record<string, any>>',
        completion: { insertText: 'await ctx.getApiInfos()' },
        params: [
          {
            name: 'options',
            type: '{ version?: string }',
            optional: true,
            description: 'Options (e.g. version).',
          },
        ],
        returns: { type: 'Promise<Record<string, any>>' },
        examples: ['const apis = await ctx.getApiInfos();'],
      },
      getVarInfos: {
        description: 'All available variables could be used to get deeper data.',
        detail: '(options?: { path?: string|string[]; maxDepth?: number }) => Promise<Record<string, any>>',
        completion: { insertText: "await ctx.getVarInfos({ path: 'record', maxDepth: 3 })" },
        params: [
          {
            name: 'options',
            type: '{ path?: string|string[]; maxDepth?: number }',
            optional: true,
            description: 'Options for path trimming and maxDepth expansion.',
          },
        ],
        returns: { type: 'Promise<Record<string, any>>' },
        examples: ["const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });"],
      },
      getEnvInfos: {
        description: 'current runtime environment',
        detail: '() => Promise<Record<string, any>>',
        completion: { insertText: 'await ctx.getEnvInfos()' },
        returns: { type: 'Promise<Record<string, any>>' },
        examples: ['const envs = await ctx.getEnvInfos();'],
      },
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
        message: {
          description: 'Ant Design 全局消息 API，用于显示临时提示。',
          detail: 'MessageInstance',
          hidden: (ctx: any) => !(ctx as any)?.message,
          examples: ['ctx.message.success("操作成功")'],
          properties: {
            info: {
              type: 'function',
              description: '显示信息提示。',
              detail: '(content: any, duration?: number) => void',
              completion: { insertText: `ctx.message.info('提示')` },
            },
            success: {
              type: 'function',
              description: '显示成功提示。',
              detail: '(content: any, duration?: number) => void',
              completion: { insertText: `ctx.message.success('成功')` },
            },
            error: {
              type: 'function',
              description: '显示错误提示。',
              detail: '(content: any, duration?: number) => void',
              completion: { insertText: `ctx.message.error('错误')` },
            },
            warning: {
              type: 'function',
              description: '显示警告提示。',
              detail: '(content: any, duration?: number) => void',
              completion: { insertText: `ctx.message.warning('警告')` },
            },
            loading: {
              type: 'function',
              description: '显示加载提示。',
              detail: '(content: any, duration?: number) => void',
              completion: { insertText: `ctx.message.loading('加载中...')` },
            },
            open: {
              type: 'function',
              description: '使用自定义配置打开消息。',
              detail: '(config: any) => void',
              completion: { insertText: `ctx.message.open({ type: 'info', content: 'Hello' })` },
            },
            destroy: {
              type: 'function',
              description: '销毁所有消息。',
              detail: '() => void',
              completion: { insertText: `ctx.message.destroy()` },
            },
          },
        },
        notification: {
          description: 'Ant Design 通知 API，用于显示通知框。',
          detail: 'NotificationInstance',
          hidden: (ctx: any) => !(ctx as any)?.notification,
          examples: ['ctx.notification.open({ message: "标题", description: "内容" })'],
          properties: {
            open: {
              type: 'function',
              description: '打开通知。',
              detail: '(config: any) => void',
              completion: { insertText: `ctx.notification.open({ message: '标题', description: '内容' })` },
            },
            success: {
              type: 'function',
              description: '打开成功通知。',
              detail: '(config: any) => void',
              completion: { insertText: `ctx.notification.success({ message: '成功' })` },
            },
            info: {
              type: 'function',
              description: '打开信息通知。',
              detail: '(config: any) => void',
              completion: { insertText: `ctx.notification.info({ message: '提示' })` },
            },
            warning: {
              type: 'function',
              description: '打开警告通知。',
              detail: '(config: any) => void',
              completion: { insertText: `ctx.notification.warning({ message: '警告' })` },
            },
            error: {
              type: 'function',
              description: '打开错误通知。',
              detail: '(config: any) => void',
              completion: { insertText: `ctx.notification.error({ message: '错误' })` },
            },
            destroy: {
              type: 'function',
              description: '销毁通知。',
              detail: '(key?: string) => void',
              completion: { insertText: `ctx.notification.destroy()` },
            },
          },
        },
        modal: {
          description: 'Ant Design modal API（HookAPI），用于打开对话框。',
          detail: 'HookAPI',
          hidden: (ctx: any) => !(ctx as any)?.modal,
          examples: [`ctx.modal.confirm({ title: '确认', content: '确定继续？' })`],
          properties: {
            info: {
              type: 'function',
              description: '打开信息对话框。',
              detail: '(config: any) => void',
              completion: { insertText: `ctx.modal.info({ title: '提示', content: '...' })` },
            },
            success: {
              type: 'function',
              description: '打开成功对话框。',
              detail: '(config: any) => void',
              completion: { insertText: `ctx.modal.success({ title: '成功', content: '...' })` },
            },
            error: {
              type: 'function',
              description: '打开错误对话框。',
              detail: '(config: any) => void',
              completion: { insertText: `ctx.modal.error({ title: '错误', content: '...' })` },
            },
            warning: {
              type: 'function',
              description: '打开警告对话框。',
              detail: '(config: any) => void',
              completion: { insertText: `ctx.modal.warning({ title: '警告', content: '...' })` },
            },
            confirm: {
              type: 'function',
              description: '打开确认对话框。',
              detail: '(config: any) => void',
              completion: { insertText: `ctx.modal.confirm({ title: '确认', content: '...' })` },
            },
          },
        },
        resource: {
          description:
            '当前上下文中的 resource 实例（FlowResource），用于访问和操作数据。多数区块、弹窗等场景下运行环境会预先绑定 resource（无需手动调用 ctx.initResource）。对于 JS Block 等默认没有 resource 的场景，可通过 ctx.initResource(type) 初始化一个，再通过 ctx.resource 使用。',
          detail: 'FlowResource',
          examples: ['await ctx.resource.refresh();'],
          properties: {
            getData: {
              description: '获取资源当前数据。',
              detail: '() => any',
              completion: { insertText: 'ctx.resource.getData()' },
            },
            setData: {
              description: '设置资源当前数据（仅前端）。',
              detail: '(value: any) => this',
              completion: { insertText: 'ctx.resource.setData(value)' },
            },
            refresh: {
              description: '从后端刷新数据（APIResource/RecordResource 等可用）。',
              detail: '() => Promise<any>',
              completion: { insertText: 'await ctx.resource.refresh()' },
            },
            on: {
              description: '订阅资源事件（例如 refresh）。',
              detail: '(event: string, callback: (...args) => void) => void',
              completion: { insertText: "ctx.resource.on('refresh', () => {})" },
            },
            off: {
              description: '取消订阅资源事件。',
              detail: '(event: string, callback: (...args) => void) => void',
              completion: { insertText: "ctx.resource.off('refresh', handler)" },
            },
            setResourceName: {
              description: '设置资源名称（例如 "users" 或 "users.profile"）。',
              detail: '(resourceName: string) => this',
              completion: { insertText: "ctx.resource.setResourceName('users')" },
            },
            setFilterByTk: {
              description: '设置主键/过滤键 filterByTk（记录资源常用）。',
              detail: '(filterByTk: any) => this',
              completion: { insertText: 'ctx.resource.setFilterByTk(filterByTk)' },
            },
            runAction: {
              description: '执行资源动作（create/update/destroy/自定义 action）。',
              detail: '(action: string, options: any) => Promise<any>',
              completion: { insertText: "await ctx.resource.runAction('create', { data: {} })" },
            },
            selectedRows: {
              description: '列表资源的选中行（通常用于表格动作；是否存在取决于资源类型）。',
              detail: 'any[]',
            },
            pagination: {
              description: '列表资源的分页信息（是否存在取决于资源类型）。',
              detail: 'Record<string, any>',
            },
          },
        },
        urlSearchParams: '当前 URL 的查询参数（URLSearchParams 对象）',
        token: '当前会话的 API 认证 token',
        role: '当前用户角色信息',
        auth: {
          description: '认证上下文，包含 locale、role、user、token 等信息',
          detail: 'AuthContext',
          properties: {
            locale: '当前 locale（例如 "en-US"、"zh-CN"）。',
            roleName: '当前角色名。',
            token: '当前 API token。',
            user: '当前用户信息对象（若可用）。',
          },
        },
        viewer: {
          description: '视图控制器（FlowViewer），提供 drawer/dialog/popover/embed 等交互能力。',
          detail: 'FlowViewer',
          examples: [
            "await ctx.viewer.drawer({ width: '56%', content: <div /> });",
            'await ctx.viewer.dialog({ content: <div /> });',
          ],
          properties: {
            drawer: {
              description: '打开抽屉视图。参数：(props: ViewProps) => any',
              detail: '(props) => any',
              completion: { insertText: "await ctx.viewer.drawer({ width: '56%', content: <div /> })" },
            },
            dialog: {
              description: '打开对话框视图。参数：(props: ViewProps) => any',
              detail: '(props) => any',
              completion: { insertText: 'await ctx.viewer.dialog({ content: <div /> })' },
            },
            popover: {
              description: '打开气泡卡片视图。参数：(props: PopoverProps) => any',
              detail: '(props) => any',
              completion: { insertText: 'await ctx.viewer.popover({ target: ctx.element?.__el, content: <div /> })' },
            },
            embed: {
              description: '打开内嵌视图。参数：(props: ViewProps & TargetProps) => any',
              detail: '(props) => any',
              completion: { insertText: 'await ctx.viewer.embed({ target: document.body, content: <div /> })' },
            },
          },
        },
        popup: {
          description:
            '弹窗上下文（在当前视图以弹窗/抽屉打开时可用）。推荐：`const popup = await ctx.getVar("ctx.popup")`。',
          detail: 'Promise<PopupContext | undefined>',
          examples: [
            'const popup = await ctx.getVar("ctx.popup");',
            'const id = popup?.record?.id;',
            'const parentId = popup?.parent?.record?.id;',
          ],
          properties: {
            uid: '弹窗 view uid（string）',
            record: '当前弹窗记录（object）',
            sourceRecord: '根据 sourceId/associationName 推断的上级记录（object）',
            resource: {
              description: '弹窗记录的数据源信息。',
              detail: 'PopupResourceInfo',
              properties: {
                dataSourceKey: '数据源 key（例如 "main"）。',
                collectionName: '集合名称。',
                associationName: '关联资源名（可选）。',
                filterByTk: '记录主键/过滤键 filterByTk。',
                sourceId: 'sourceId（可选）。',
              },
            },
            parent: '上级弹窗信息（object）。运行时若存在可访问 parent.parent... 链。',
          },
        },
        i18n: {
          description: 'i18next 实例，可用于管理国际化',
          detail: 'i18next',
          properties: {
            language: '当前激活的语言代码',
          },
        },
        dayjs: {
          type: 'function',
          description: 'dayjs 日期时间工具库（可调用）。',
          detail: 'dayjs',
          completion: { insertText: 'ctx.dayjs()' },
          examples: ["const now = ctx.dayjs().format('YYYY-MM-DD HH:mm:ss');"],
        },
        React: 'React 命名空间，提供 React 函数与 hooks（RunJS 环境中可用）。推荐使用 `ctx.libs.React` 访问。',
        ReactDOM: 'ReactDOM 客户端 API，含 createRoot 等渲染方法。推荐通过 `ctx.libs.ReactDOM` 访问。',
        antd: 'Ant Design 组件库（RunJS 环境中可用）。推荐使用 `ctx.libs.antd` 访问。',
        libs: {
          description:
            '第三方/通用库的统一命名空间，包含 React、ReactDOM、Ant Design、dayjs、icons 等，并可扩展更多工具库（如 lodash、formula、math）。后续新增库会优先挂在此处。',
          detail: '通用库命名空间',
          properties: {
            React: 'React 命名空间（等价于 ctx.React）。',
            ReactDOM: 'ReactDOM 客户端 API（等价于 ctx.ReactDOM）。',
            antd: 'Ant Design 组件库（等价于 ctx.antd）。',
            dayjs: 'dayjs 日期时间工具库。',
            antdIcons: 'Ant Design 图标库。 例如：`ctx.libs.antdIcons.PlusOutlined`。',
            lodash: 'Lodash 工具库。示例：`ctx.libs.lodash.get(obj, "a.b")`。',
            formula: 'Formula.js 公式库（类表格函数）。示例：`ctx.libs.formula.SUM(1, 2, 3)`。',
            math: 'mathjs 数学库。示例：`ctx.libs.math.evaluate("2 + 3")`。',
          },
        },
      },
      methods: {
        request: {
          description: '使用 APIClient 实例发起一个 HTTP 请求。参数：(options: RequestOptions) => Promise<any>',
          detail: '(options: RequestOptions) => Promise<any>',
          completion: { insertText: `await ctx.request({ url: '', method: 'get', params: {} })` },
        },
        getModel: {
          description: '根据 uid 获取模型实例。默认会跨当前视图栈查找，并返回第一个命中的模型。',
          detail: '(uid: string, searchInPreviousEngines?: boolean) => FlowModel | undefined',
          completion: { insertText: `ctx.getModel('block-uid-xxx')` },
          params: [
            {
              name: 'uid',
              type: 'string',
              description: '目标模型 uid。',
            },
            {
              name: 'searchInPreviousEngines',
              type: 'boolean',
              optional: true,
              description: '是否在之前的引擎中搜索模型，默认为 false。',
            },
          ],
          returns: { type: 'FlowModel | undefined' },
          examples: ["const model = ctx.getModel('block-uid-xxx');"],
        },
        t: '国际化函数，用于翻译文案。参数：(key: string, variables?: object) => string。示例：`ctx.t("你好 {{name}}", { name: "世界" })`',
        initResource: {
          description:
            '初始化当前上下文的资源：若尚未存在 ctx.resource，则按资源类名创建并绑定；若已存在则直接复用。常用值："MultiRecordResource"、"SingleRecordResource"、"SQLResource"。',
          detail: '(resourceType: ResourceType) => void',
          completion: { insertText: "ctx.initResource('MultiRecordResource')" },
          examples: ["ctx.initResource('MultiRecordResource'); ctx.resource.setResourceName('users');"],
        },
        makeResource: {
          description:
            '创建一个新的资源实例，不会自动绑定到 ctx.resource。适合需要多个独立资源或临时资源的场景。常用值："MultiRecordResource"、"SingleRecordResource"、"SQLResource"。',
          detail: '(resourceType) => FlowResource',
          completion: { insertText: "const resource = ctx.makeResource('SingleRecordResource')" },
          examples: ["const resource = ctx.makeResource('SingleRecordResource'); resource.setResourceName('users');"],
        },
        render: {
          description:
            '渲染到容器。vnode 支持 ReactElement、DOM 节点/片段、或 HTML 字符串。参数：(vnode: ReactElement | Node | DocumentFragment | string, container?: HTMLElement|ElementProxy) => Root|null。示例：`ctx.render(<div />)` 或 `ctx.render("<b>hi</b>")`',
          detail: 'ReactDOM Root',
          completion: {
            insertText: `ctx.render(<div />)`,
          },
        },
        requireAsync:
          '按 URL 异步加载 UMD/AMD 或挂到全局的脚本，也可加载 CSS。支持简写路径（如 "echarts@5/dist/echarts.min.js"，会经由 ESM CDN 加 ?raw 获取原始文件）和完整 URL，返回加载后的库对象或样式注入结果。',
        importAsync:
          '按 URL 动态加载 ESM 模块或 CSS。支持简写（如 "vue@3.4.0"、"dayjs@1/plugin/relativeTime.js"，会按配置拼接 ESM CDN 前缀）和完整 URL，返回模块命名空间或样式注入结果。',
        getVar: {
          description: '通过表达式路径字符串获取 ctx 的运行时值（以 "ctx." 开头）。',
          detail: '(path: string) => Promise<any>',
          completion: { insertText: "await ctx.getVar('ctx.record.id')" },
          params: [
            {
              name: 'path',
              type: 'string',
              description: '以 "ctx." 开头的表达式路径（例如 "ctx.record.id" / "ctx.record.roles[0].id"）。',
            },
          ],
          returns: { type: 'Promise<any>' },
          examples: ["const id = await ctx.getVar('ctx.record.id');"],
        },
        getApiInfos: {
          description: '上下文命名空间下的所有可用 API',
          detail: '(options?: { version?: string }) => Promise<Record<string, any>>',
          completion: { insertText: 'await ctx.getApiInfos()' },
          params: [
            {
              name: 'options',
              type: '{ version?: string }',
              optional: true,
              description: '可选参数（例如 version）。',
            },
          ],
          returns: { type: 'Promise<Record<string, any>>' },
          examples: ['const apis = await ctx.getApiInfos();'],
        },
        getVarInfos: {
          description: '所有可用变量，可用于获取更深层数据。',
          detail: '(options?: { path?: string|string[]; maxDepth?: number }) => Promise<Record<string, any>>',
          completion: { insertText: "await ctx.getVarInfos({ path: 'record', maxDepth: 3 })" },
          params: [
            {
              name: 'options',
              type: '{ path?: string|string[]; maxDepth?: number }',
              optional: true,
              description: 'path 剪裁与 maxDepth 展开参数。',
            },
          ],
          returns: { type: 'Promise<Record<string, any>>' },
          examples: ["const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });"],
        },
        getEnvInfos: {
          description: '当前运行时环境',
          detail: '() => Promise<Record<string, any>>',
          completion: { insertText: 'await ctx.getEnvInfos()' },
          returns: { type: 'Promise<Record<string, any>>' },
          examples: ['const envs = await ctx.getEnvInfos();'],
        },
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
