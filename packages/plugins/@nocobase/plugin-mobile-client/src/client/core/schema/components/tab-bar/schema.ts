/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const tabItemSchema = {
  properties: {
    title: {
      type: 'string',
      title: `{{ t('Title') }}`,
      required: true,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
    },
    icon: {
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'IconPicker',
      title: `{{ t('Icon') }}`,
      'x-component-props': {},
    },
  },
};
