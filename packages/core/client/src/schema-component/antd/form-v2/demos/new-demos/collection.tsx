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
        collection: 'users', // users 数据表
        dataSource: 'main', // 多数据源标识，可以不写，默认为 main
      },
      properties: {
        form: {
          'x-component': 'FormV2',
          properties: {
            username: {
              type: 'string',
              'x-decorator': 'FormItem',
              // 'x-component': 'Input',
              // title: 'Username',
              // required: true,
              'x-component': 'CollectionField', // 这里替换为 CollectionField，会自动根据 users 数据表的配置生成对应的组件
            },
            nickname: {
              type: 'string',
              'x-decorator': 'FormItem',
              // 'x-component': 'Input',
              // title: 'Nickname',
              'x-component': 'CollectionField', // 这里替换为 CollectionField，会自动根据 users 数据表的配置生成对应的组件
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
      scope={{ useSubmitActionProps }}
    />
  );
};

const app = new Application({
  providers: [Demo],
});

mockApp({ app });

export default app.getRootComponent();
