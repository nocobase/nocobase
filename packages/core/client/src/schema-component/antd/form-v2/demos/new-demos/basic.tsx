/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { App as AntdApp } from 'antd';

import { useForm } from '@formily/react';
import {
  ActionProps,
  useAPIClient,
  Application,
  Input,
  Action,
  FormItem,
  FormV2,
  SchemaComponent,
  ISchema,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';

function useSubmitActionProps(): ActionProps {
  const form = useForm();
  const api = useAPIClient();
  const { message } = AntdApp.useApp();

  return {
    type: 'primary',
    htmlType: 'submit',
    async onClick() {
      await form.submit();
      const values = form.values;

      const { data } = await api.request({ url: 'users:create', method: 'post', data: values });
      if (data.result === 'ok') {
        message.success('Submit success');
      }
    },
  };
}

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-component': 'FormV2',
      properties: {
        username: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'Username',
          required: true,
        },
        nickname: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'Nickname',
        },
        password: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'Password',
        },
        button: {
          type: 'void',
          'x-component': 'Action',
          title: 'Submit',
          'x-use-component-props': useSubmitActionProps,
        },
      },
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} components={{ FormV2, FormItem, Input, Action }} />;
};

const app = new Application({
  providers: [Demo],
});

mockApp({ app });

export default app.getRootComponent();
