/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSchemaContribution } from '../../flow-schema-registry';

export const flowSchemaContribution: FlowSchemaContribution = {
  fieldBindings: [
    {
      context: 'editable-field',
      use: 'InputFieldModel',
      interfaces: ['sequence'],
      isDefault: true,
    },
    {
      context: 'display-field',
      use: 'DisplayTextFieldModel',
      interfaces: ['sequence'],
      isDefault: true,
    },
    {
      context: 'filter-field',
      use: 'InputFieldModel',
      interfaces: ['sequence'],
      isDefault: true,
    },
  ],
  defaults: {
    source: 'plugin',
  },
};
