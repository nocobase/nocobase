/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import {
  ActionProps,
  Application,
  CollectionField,
  FormBlockProvider,
  FormItem,
  FormV2,
  ISchema,
  Input,
  SchemaComponent,
  useDataBlockResource,
  useFormBlockProps,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';

import { App as AntdApp } from 'antd';
import React from 'react';

function useSubmitActionProps(): ActionProps {
  const form = useForm();
  const resource = useDataBlockResource();
  const { message } = AntdApp.useApp();

  return {
    type: 'primary',
    htmlType: 'submit',
    async onClick() {
      await form.submit();
      const values = form.values;

      const { data } = await resource.update(values);
      if (data.result === 'ok') {
        message.success('Submit success');
        form.reset();
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
      'x-component': 'FormBlockProvider',
      'x-component-props': {
        collection: 'users',
        action: 'get', // 获取数据
        filterByTk: 1, // 获取 id 为 1 的数据
        dataSource: 'main',
      },
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useFormBlockProps',
          properties: {
            username: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            nickname: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            submit: {
              type: 'void',
              'x-component': 'Action',
              title: 'Submit',
              'x-use-component-props': 'useSubmitActionProps',
            },
          },
        },
      },
    },
  },
};

const Demo = () => {
  return (
    <SchemaComponent
      schema={schema}
      components={{ FormV2, FormItem, CollectionField, FormBlockProvider, Input }}
      scope={{ useFormBlockProps, useSubmitActionProps }}
    />
  );
};

const app = new Application({
  providers: [Demo],
});

mockApp({ app });

export default app.getRootComponent();
