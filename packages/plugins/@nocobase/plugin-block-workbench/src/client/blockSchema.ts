/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@nocobase/client';

export const blockSchema: ISchema = {
  type: 'void',
  'x-decorator': 'CardItem',
  'x-decorator-props': {
    title: '',
  },
  'x-settings': 'blockSettings:workbench',
  'x-schema-toolbar': 'BlockSchemaToolbar',
  'x-component': 'WorkbenchBlock',
  properties: {
    actions: {
      'x-component': 'WorkbenchBlock.ActionBar',
      'x-initializer': 'workbench:configureActions',
    },
  },
};
