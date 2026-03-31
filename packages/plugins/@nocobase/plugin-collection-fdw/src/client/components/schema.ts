/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { ISchema } from '@formily/react';
import { NAMESPACE } from '../../locale';

const serverFormSchema = {
  description: {
    type: 'string',
    title: `{{t("Display name",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  name: {
    type: 'string',
    title: `{{t("Server name",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-validator': 'uid',
    'x-disabled': '{{ createOnly }}',
    description:
      "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
  },
  host: {
    type: 'string',
    title: `{{t("Host",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'TextAreaWithGlobalScope',
  },
  port: {
    type: 'string',
    title: `{{t("Port",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'TextAreaWithGlobalScope',
  },
  database: {
    type: 'string',
    title: `{{t("Database",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'TextAreaWithGlobalScope',
  },
  username: {
    type: 'string',
    title: `{{t("Username",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'TextAreaWithGlobalScope',
  },
  password: {
    type: 'string',
    title: `{{t("Password",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'TextAreaWithGlobalScope',
    'x-component-props': { password: true },
  },
};

export const createDatabaseServerSchema: ISchema = {
  type: 'object',
  properties: {
    form: {
      type: 'void',
      'x-decorator': 'Form',
      'x-component': 'Action.Modal',
      title: `{{ t("Create database server",{ ns: "${NAMESPACE}" }) }}`,
      'x-component-props': {
        width: 520,
        getContainer: '{{ getContainer }}',
      },
      properties: {
        ...serverFormSchema,
        footer: {
          type: 'void',
          'x-component': 'Action.Modal.Footer',
          properties: {
            testConnectiion: {
              title: `{{ t("Test Connection",{ ns: "${NAMESPACE}" }) }}`,
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useTestConnectionAction }}',
              },
            },
            action1: {
              title: '{{ t("Cancel") }}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useCancelAction }}',
              },
            },
            action2: {
              title: '{{ t("Submit") }}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                useAction: '{{ useCreateDatabaseServer }}',
              },
            },
          },
        },
      },
    },
  },
};

export const editDatabaseServerSchema: ISchema = {
  type: 'object',
  properties: {
    form: {
      type: 'void',
      'x-decorator': 'Form',
      'x-decorator-props': {
        useValues: '{{useEditServerProps}}',
      },
      'x-component': 'Action.Modal',
      title: `{{ t("Edit database server",{ ns: "${NAMESPACE}" }) }}`,
      'x-component-props': {
        width: 520,
        getContainer: '{{ getContainer }}',
      },
      properties: {
        ...serverFormSchema,
        footer: {
          type: 'void',
          'x-component': 'Action.Modal.Footer',
          properties: {
            testConnectiion: {
              title: `{{ t("Test Connection",{ ns: "${NAMESPACE}" }) }}`,
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useTestConnectionAction }}',
              },
            },
            action1: {
              title: '{{ t("Cancel") }}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useCancelAction }}',
              },
            },
            action2: {
              title: '{{ t("Submit") }}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                useAction: '{{ useEditDatabaseServer }}',
              },
            },
          },
        },
      },
    },
  },
};
