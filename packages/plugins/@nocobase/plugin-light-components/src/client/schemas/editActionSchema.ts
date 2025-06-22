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

export const editActionSchema: ISchema = {
  type: 'void',
  title: tStr('Edit'),
  'x-component': 'Action.Link',
  'x-component-props': {
    openSize: 'small',
  },
  properties: {
    modal: {
      type: 'void',
      title: tStr('Edit Light Component'),
      'x-decorator': 'FormV2',
      'x-component': 'Action.Modal',
      'x-use-component-props': 'useEditFormProps',
      properties: {
        title: {
          type: 'string',
          title: tStr('Title'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        key: {
          type: 'string',
          title: tStr('Key'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-disabled': true,
        },
        description: {
          type: 'string',
          title: tStr('Description'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
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
              },
              'x-use-component-props': 'useEditActionProps',
            },
          },
        },
      },
    },
  },
};
