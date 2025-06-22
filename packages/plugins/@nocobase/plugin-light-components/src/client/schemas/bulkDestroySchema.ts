/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// @ts-ignore
import { ISchema } from '@nocobase/client';
import { tStr } from '../locale';

export const bulkDestroySchema: ISchema = {
  type: 'void',
  title: tStr('Delete'),
  'x-component': 'Action',
  'x-component-props': {
    icon: 'DeleteOutlined',
    openSize: 'small',
  },
  properties: {
    modal: {
      type: 'void',
      title: tStr('Delete Selected Light Components'),
      'x-component': 'Action.Modal',
      'x-component-props': {
        openSize: 'small',
      },
      properties: {
        content: {
          type: 'void',
          'x-component': 'div',
          'x-content': tStr('Are you sure to delete selected light components? This action cannot be undone.'),
          'x-component-props': {
            style: {
              marginBottom: 16,
            },
          },
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
              title: '{{t("Delete")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                danger: true,
              },
              'x-use-component-props': 'useBulkDestroyAction',
            },
          },
        },
      },
    },
  },
};
