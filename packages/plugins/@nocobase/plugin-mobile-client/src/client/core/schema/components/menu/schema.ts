/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { generateNTemplate } from '../../../../locale';

export const menuItemSchema = {
  properties: {
    name: {
      type: 'string',
      title: generateNTemplate('Menu name'),
      required: true,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
    },
    icon: {
      'x-decorator': 'FormItem',
      'x-component': 'IconPicker',
      title: generateNTemplate('Icon'),
      'x-component-props': {},
    },
  },
};
