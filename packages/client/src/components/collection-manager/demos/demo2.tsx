import React from 'react';
import { observer, ISchema, useForm } from '@formily/react';
import {
  SchemaComponent,
  SchemaComponentProvider,
  Form,
  Action,
  CollectionProvider,
  Collection,
} from '@nocobase/client';
import 'antd/dist/antd.css';
import { FormItem, Input } from '@formily/antd';

export default observer(() => {
  const collection = {
    name: 'tests',
    fields: [
      {
        type: 'string',
        name: 'title1',
        interface: 'input',
        uiSchema: {
          title: 'Title',
          type: 'string',
          'x-component': 'Input',
          required: true,
        },
      },
      {
        type: 'string',
        name: 'title2',
        interface: 'input',
        uiSchema: {
          title: 'Title2',
          type: 'string',
          'x-component': 'Input',
        },
      },
      {
        type: 'string',
        name: 'title3',
      },
    ],
  };

  const schema: ISchema = {
    type: 'object',
    properties: {
      form1: {
        type: 'void',
        'x-component': 'Form',
        properties: {
          // 字段 title1 直接使用全局提供的 uiSchema
          title1: {
            'x-component': 'Collection.Field',
            'x-decorator': 'Collection.FormItem',
          },
          // 等同于
          // title1: {
          //   type: 'string',
          //   title: 'Title',
          //   required: true,
          //   'x-component': 'Input',
          //   'x-decorator': 'FormItem',
          // },
          title2: {
            'x-component': 'Collection.Field',
            'x-decorator': 'Collection.FormItem',
            title: 'Title22', // 覆盖全局已定义的 Title2
            required: true, // 扩展的配置参数
          },
          // 等同于
          // title2: {
          //   type: 'string',
          //   title: 'Title22',
          //   required: true,
          //   'x-component': 'Input',
          //   'x-decorator': 'FormItem',
          // },
          // 字段 title3 没有提供 uiSchema，自行处理
          title3: {
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            title: 'Title3',
            required: true,
          },
          action1: {
            // type: 'void',
            'x-component': 'Action',
            title: 'Submit',
            'x-component-props': {
              useAction: '{{ useSubmit }}',
            },
          },
        },
      },
    },
  };

  const useSubmit = () => {
    const form = useForm();
    return {
      async run() {
        console.log(form.values);
      },
    };
  };

  return (
    <SchemaComponentProvider scope={{ useSubmit }} components={{ Action, Form, Collection, Input, FormItem }}>
      <CollectionProvider {...collection}>
        <SchemaComponent schema={schema} />
      </CollectionProvider>
    </SchemaComponentProvider>
  );
});
