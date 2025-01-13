/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExclamationCircleFilled } from '@ant-design/icons';
import React from 'react';
import { tStr } from '../locale';

export const bulkDestroySchema = {
  name: 'bulkDestroySchema',
  type: 'void',
  'x-component': 'Action',
  'x-component-props': {
    openSize: 'small',
    icon: 'DeleteOutlined',
  },
  title: '{{t("Delete")}}',
  properties: {
    modal: {
      type: 'void',
      'x-component': 'Action.Modal',
      title: '{{t("Delete")}}',
      properties: {
        keepBlocks: {
          type: 'boolean',
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
          'x-content': tStr('Keep the created blocks?'),
          default: true,
        },
        footer: {
          type: 'void',
          'x-component': 'Action.Modal.Footer',
          properties: {
            cancel: {
              type: 'void',
              title: '{{t("Cancel")}}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ cm.useCancelAction }}',
              },
            },
            submit: {
              type: 'void',
              title: '{{t("Submit")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                useAction: '{{ useBulkDestroyAction }}',
              },
            },
          },
        },
      },
    },
  },
};
