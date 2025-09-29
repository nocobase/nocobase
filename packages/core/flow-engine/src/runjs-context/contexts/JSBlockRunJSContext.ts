/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from './FlowRunJSContext';
import { createSafeDocument, createSafeWindow } from '../../utils';

export class JSBlockRunJSContext extends FlowRunJSContext {
  static injectDefaultGlobals() {
    return { window: createSafeWindow(), document: createSafeDocument() };
  }
  constructor(delegate: any) {
    super(delegate);
    // 显式暴露本场景所需属性
    this.defineProperty('element', { get: () => (this as any)._delegate['element'] });
    this.defineProperty('record', { get: () => (this as any)._delegate['record'] });
    this.defineProperty('value', { get: () => (this as any)._delegate['value'] });
  }
}

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
  snipastes: {
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
