/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class JSItemRunJSContext extends FlowRunJSContext {}

JSItemRunJSContext.define({
  label: 'JSItem RunJS context',
  properties: {
    element: `ElementProxy instance providing a safe DOM container for form item rendering.
      Supports innerHTML, append, and other DOM manipulation methods.`,
    resource: `Current resource instance (read-only).
      Provides access to the data resource associated with the current form context.`,
    record: `Current record data object (read-only).
      Contains all field values of the parent record.`,
  },
  methods: {
    onRefReady: `Wait for form item container DOM element to be ready before executing callback.
      Parameters: (ref: React.RefObject, callback: (element: HTMLElement) => void, timeout?: number) => void`,
  },
  snippets: {
    'Render form item': { $ref: 'scene/jsitem/render-basic', prefix: 'sn-jsitem-basic' },
  },
});
