/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NAMESPACE } from '../constants';
import { useContext } from 'react';
import { NewTemplateFormContext } from '../components/AddNewTemplate';

export const createActionSchema = {
  type: 'object',
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
      'x-use-decorator-props': function useCreateFormProps() {
        const form = useContext(NewTemplateFormContext);
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
