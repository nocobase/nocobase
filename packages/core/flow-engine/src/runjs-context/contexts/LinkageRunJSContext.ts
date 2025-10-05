/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class LinkageRunJSContext extends FlowRunJSContext {}

LinkageRunJSContext.define({
  label: 'Linkage RunJS context',
  properties: {
    model: `Current block or field model (read-only access).
      Provides access to the Formily form model for the current context.`,
    fields: `Collection of accessible fields in the current form (read-only).
      Use this to access and manipulate other fields in linkage rules.`,
  },
  snippets: {
    'Set field value': { $ref: 'scene/linkage/set-field-value', prefix: 'sn-link-set' },
    'Toggle visible': { $ref: 'scene/linkage/toggle-visible', prefix: 'sn-link-visibility' },
    'Set disabled': { $ref: 'scene/linkage/set-disabled', prefix: 'sn-link-disable' },
    'Set required': { $ref: 'scene/linkage/set-required', prefix: 'sn-link-required' },
  },
});
