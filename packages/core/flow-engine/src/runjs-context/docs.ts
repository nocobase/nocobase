/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * RunJS context documentation definitions (kept separate for clarity).
 */
import { FlowRunJSContext } from '../flowContext';
import {
  JSBlockRunJSContext,
  JSFieldRunJSContext,
  JSItemRunJSContext,
  FormJSFieldItemRunJSContext,
  JSRecordActionRunJSContext,
  JSCollectionActionRunJSContext,
  LinkageRunJSContext,
} from './flowRunJSContext';

FlowRunJSContext.define({
  label: 'RunJS base',
  properties: {
    t: "国际化函数。示例：`ctx.t('Hello {name}', { name: 'World' })`",
    logger: "Pino logger 子实例。`ctx.logger.info({ foo: 1 }, 'msg')`",
    message: "AntD 全局消息。`ctx.message.success('done')`",
    notification: "AntD 通知。`ctx.notification.open({ message: 'Hi' })`",
    requireAsync: '异步加载外部库。`const x = await ctx.requireAsync(url)`',
    copyToClipboard: '复制文本到剪贴板。`await ctx.copyToClipboard(text)`',
    resolveJsonTemplate: '解析含 {{ }} 的模板/表达式',
    runAction: '运行当前模型动作。`await ctx.runAction(name, params)`',
    resource: '数据资源（按委托可见）',
    urlSearchParams: 'URL 查询参数对象',
    token: 'API Token',
    role: '当前角色',
    auth: '认证信息（locale/role/user/token）',
    api: 'APIClient 实例',
    React: 'React 命名空间（RunJS 环境可用）',
    react: 'React 别名（小写）',
    ReactDOM: 'ReactDOM 客户端（含 createRoot）',
    antd: 'AntD 组件库（RunJS 环境可用）',
  },
  methods: {
    openView: '打开视图：`await ctx.openView(viewId, { ... })`',
  },
});

JSBlockRunJSContext.define({
  label: 'JSBlock RunJS context',
  properties: {
    element: 'ElementProxy，安全 DOM 容器。支持 innerHTML/append 等',
    record: '当前记录（只读，存在于数据块/详情等场景）',
    value: '当前值（若存在）',
    React: 'React（已注入）',
    antd: 'AntD（已注入）',
  },
  methods: {
    onRefReady: 'Container ref ready callback:\n```js\nctx.onRefReady(ctx.ref, el => { /* ... */ })\n```',
    requireAsync: 'Load external library: `const lib = await ctx.requireAsync(url)`',
  },
  snippets: {
    'Render HTML': { $ref: 'scene/jsblock/render-basic', prefix: 'sn-jsb-html' },
    'Render React': { $ref: 'scene/jsblock/render-react', prefix: 'sn-jsb-react' },
    'Init ECharts': { $ref: 'libs/echarts-init', prefix: 'sn-echarts' },
    'Render card': { $ref: 'scene/jsblock/render-card', prefix: 'sn-jsb-card' },
    'Button handler': { $ref: 'scene/jsblock/render-button-handler', prefix: 'sn-jsb-button' },
    'JSX mount': { $ref: 'scene/jsblock/jsx-mount', prefix: 'sn-jsx-mount' },
    'JSX unmount': { $ref: 'scene/jsblock/jsx-unmount', prefix: 'sn-jsx-unmount' },
    Notification: { $ref: 'global/notification-open', prefix: 'sn-notify' },
    'Window open': { $ref: 'global/window-open', prefix: 'sn-window-open' },
    'Add click listener': { $ref: 'scene/jsblock/add-event-listener', prefix: 'sn-jsb-click' },
    'Append style': { $ref: 'scene/jsblock/append-style', prefix: 'sn-jsb-style' },
  },
});

JSFieldRunJSContext.define({
  label: 'JSField RunJS context',
  properties: {
    element: 'ElementProxy，字段渲染容器',
    value: '字段当前值（只读）',
    record: '当前记录（只读）',
    collection: '集合定义（只读）',
  },
  methods: {
    onRefReady: 'Container ready callback',
  },
  snippets: {
    'Render value': { $ref: 'scene/jsfield/innerHTML-value', prefix: 'sn-jsf-value' },
    'Message success': { $ref: 'global/message-success', prefix: 'sn-msg-ok' },
    'Format number': { $ref: 'scene/jsfield/format-number', prefix: 'sn-jsf-num' },
    'Color by value': { $ref: 'scene/jsfield/color-by-value', prefix: 'sn-jsf-color' },
  },
});

JSItemRunJSContext.define({
  label: 'JSItem RunJS context',
  properties: {
    element: 'ElementProxy，表单项渲染容器',
    resource: '当前资源（只读）',
    record: '当前记录（只读）',
  },
  methods: {
    onRefReady: 'Container ready callback',
    requireAsync: 'Load external library',
  },
  snippets: {
    'Render form item': { $ref: 'scene/jsitem/render-basic', prefix: 'sn-jsitem-basic' },
  },
});

FormJSFieldItemRunJSContext.define({
  label: 'FormJSFieldItem RunJS context',
  properties: {
    element: 'ElementProxy，表单字段容器',
    value: '字段值（读/受控场景需通过 setProps 修改）',
    record: '当前记录（只读）',
  },
  methods: {
    onRefReady: '容器就绪回调',
    setProps: '设置表单项属性：`setProps(fieldModel, { value })`（由联动/表单上下文提供）',
  },
  snippets: {
    显示字段值: { $ref: 'scene/jsfield/innerHTML-value', prefix: 'sn-form-value' },
  },
});

JSRecordActionRunJSContext.define({
  label: 'JSRecordAction RunJS context',
  properties: {
    record: '当前记录（只读）',
    filterByTk: '主键/过滤键（只读）',
  },
  methods: {
    runAction: 'Run action: `await ctx.runAction(name, params)`',
    message: 'Message API',
  },
  snippets: {
    'Show record id': { $ref: 'scene/actions/record-id-message', prefix: 'sn-act-record-id' },
    'Run action': { $ref: 'scene/actions/run-action-basic', prefix: 'sn-act-run' },
  },
});

JSCollectionActionRunJSContext.define({
  label: 'JSCollectionAction RunJS context',
  properties: {
    resource: '列表资源（选中行/分页等）',
  },
  methods: {
    runAction: 'Run action',
    message: 'Message API',
  },
  snippets: {
    'Selected count': { $ref: 'scene/actions/collection-selected-count', prefix: 'sn-act-selected-count' },
    'Iterate selected rows': { $ref: 'scene/actions/iterate-selected-rows', prefix: 'sn-act-iterate' },
  },
});

LinkageRunJSContext.define({
  label: 'Linkage RunJS context',
  properties: {
    model: '当前块/字段模型（只读访问）',
    fields: '可访问的字段集合（只读）',
  },
  methods: {
    message: 'Message API',
  },
  snippets: {
    'Set field value': { $ref: 'scene/linkage/set-field-value', prefix: 'sn-link-set' },
    'Toggle visible': { $ref: 'scene/linkage/toggle-visible', prefix: 'sn-link-visibility' },
    'Set disabled': { $ref: 'scene/linkage/set-disabled', prefix: 'sn-link-disable' },
    'Set required': { $ref: 'scene/linkage/set-required', prefix: 'sn-link-required' },
  },
});
