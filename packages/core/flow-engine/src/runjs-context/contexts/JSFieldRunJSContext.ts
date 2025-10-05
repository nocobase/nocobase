/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class JSFieldRunJSContext extends FlowRunJSContext {}

JSFieldRunJSContext.define({
  label: 'JSField RunJS context',
  properties: {
    element: `ElementProxy instance providing a safe DOM container for field rendering.
      Supports innerHTML, append, and other DOM manipulation methods.`,
    value: `Current value of the field (read-only).
      Contains the data value stored in this field.`,
    record: `Current record data object (read-only).
      Contains all field values of the parent record.`,
    collection: `Collection definition metadata (read-only).
      Provides schema information about the collection this field belongs to.`,
  },
  methods: {
    onRefReady: `Wait for field container DOM element to be ready before executing callback.
      Parameters: (ref: React.RefObject, callback: (element: HTMLElement) => void, timeout?: number) => void
      Example: ctx.onRefReady(ctx.ref, (el) => { el.innerHTML = ctx.value })`,
  },
  snippets: {
    'Render value': { $ref: 'scene/jsfield/innerHTML-value', prefix: 'sn-jsf-value' },
    'Message success': { $ref: 'global/message-success', prefix: 'sn-msg-ok' },
    'Format number': { $ref: 'scene/jsfield/format-number', prefix: 'sn-jsf-num' },
    'Color by value': { $ref: 'scene/jsfield/color-by-value', prefix: 'sn-jsf-color' },
  },
});
