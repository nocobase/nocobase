/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const editActionSchema = {
  type: 'void',
  title: "{{t('Edit')}}",
  'x-component': 'Action.Link',
  'x-component-props': {
    openMode: 'drawer',
  },
  properties: {
    drawer: {
      type: 'void',
      title: 'Edit',
      'x-component': 'Action.Drawer',
      'x-decorator': 'FormV2',
      'x-use-decorator-props': 'useEditFormProps',
      properties: {
        form: {
          type: 'void',
          properties: {
            title: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            collection: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
              'x-component-props': {
                disabled: true,
              },
            },
            type: {
              type: 'string',
              'x-decorator': 'FormItem',
              title: `{{t("Type",{ns:"public-forms"})}}`,
              'x-component': 'Radio.Group',
              default: 'form',
              enum: '{{ formTypes }}',
            },
            description: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },

            password: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            enabled: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
              default: true,
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
              'x-use-component-props': 'useSubmitActionProps',
            },
          },
        },
      },
    },
  },
};
