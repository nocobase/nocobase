/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class JSBlockRunJSContext extends FlowRunJSContext {}

JSBlockRunJSContext.define({
  label: 'JSBlock RunJS context',
  properties: {
    element: `ElementProxy instance providing a safe DOM container.
      Supports innerHTML, append, and other DOM manipulation methods.
      Use this to render content in the JS block.`,
    record: `Current record data object (read-only).
      Available when the JS block is within a data block or detail view context.`,
    value: 'Current value of the field or component, if available in the current context.',
  },
  methods: {
    onRefReady: `Wait for container DOM element to be ready before executing callback.
      Parameters: (ref: React.RefObject, callback: (element: HTMLElement) => void, timeout?: number) => void
      Example: ctx.onRefReady(ctx.ref, (el) => { el.innerHTML = "Ready!" })`,
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
