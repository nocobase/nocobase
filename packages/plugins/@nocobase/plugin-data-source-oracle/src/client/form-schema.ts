/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';

export const oracleFormSchema: ISchema = {
  type: 'object',
  properties: {
    displayName: {
      type: 'string',
      title: '{{t("Display name")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    connectString: {
      type: 'string',
      title: '{{t("Connect string")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    user: {
      type: 'string',
      title: '{{t("User")}}',
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
  },
};
