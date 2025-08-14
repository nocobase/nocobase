/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';

export const mysqlFormSchema: ISchema = {
  type: 'object',
  properties: {
    displayName: {
      type: 'string',
      title: '{{t("Display name")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    host: {
      type: 'string',
      title: '{{t("Host")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    port: {
      type: 'number',
      title: '{{t("Port")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
    },
    username: {
      type: 'string',
      title: '{{t("Username")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    password: {
      type: 'string',
      title: '{{t("Password")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Password',
    },
    database: {
      type: 'string',
      title: '{{t("Database")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    socketPath: {
      type: 'string',
      title: '{{t("Socket path")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
};
