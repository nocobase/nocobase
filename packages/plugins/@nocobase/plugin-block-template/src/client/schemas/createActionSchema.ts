/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils/client';
import { NAMESPACE } from '../constants';
import { createForm } from '@formily/core';

export const createActionSchema = {
  type: 'void',
  'x-component': 'Action',
  title: `{{t("Add new", { ns: "${NAMESPACE}" })}}`,
  'x-align': 'right',
  'x-component-props': {
    type: 'primary',
    icon: 'PlusOutlined',
    openMode: 'drawer',
  },
  properties: {
    drawer: {
      type: 'void',
      'x-component': 'Action.Drawer',
      title: `{{t("Add new", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormV2',
      'x-use-decorator-props': () => {
        const form = createForm({
          initialValues: {
            key: `t_${uid()}`,
            type: 'Desktop',
          },
        });
        return { form };
      },
      properties: {
        form: {
          type: 'void',
          properties: {
            title: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            key: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
              'x-validator': 'uid',
              description:
                "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
            },
            type: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            description: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
          },
        },
        footer: {
          type: 'void',
          'x-component': 'Action.Drawer.Footer',
          properties: {
            submit: {
              title: 'Submit',
              'x-component': 'Action',
              'x-use-component-props': 'useCreateActionProps',
            },
          },
        },
      },
    },
  },
};
