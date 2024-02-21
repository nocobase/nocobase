import { ISchema, observer, useForm } from '@formily/react';
import {
  Action,
  Application,
  CollectionProvider,
  Form,
  SchemaComponent,
  FormItem,
  InheritanceCollectionMixin,
  Input,
  SchemaComponentOptions,
} from '@nocobase/client';
import React from 'react';

const collection = {
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'title1',
      interface: 'input',
      uiSchema: {
        title: 'Title1',
        type: 'string',
        'x-component': 'Input',
        required: true,
        description: 'description1',
      } as ISchema,
    },
    {
      type: 'string',
      name: 'title2',
      interface: 'input',
      uiSchema: {
        title: 'Title2',
        type: 'string',
        'x-component': 'Input',
        description: 'description',
        default: 'ttt',
      },
    },
    {
      type: 'string',
      name: 'title3',
    },
  ],
};

const Root = observer(() => {
  const schema: ISchema = {
    type: 'object',
    properties: {
      form1: {
        type: 'void',
        'x-component': 'Form',
        properties: {
          // 字段 title1 直接使用全局提供的 uiSchema
          title1: {
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
            default: '111',
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
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
            title: 'Title4', // 覆盖全局已定义的 Title2
            required: true, // 扩展的配置参数
            description: 'description4',
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
              type: 'primary',
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
        form.submit(() => {
          console.log(form.values);
        });
      },
    };
  };

  return (
    <SchemaComponentOptions scope={{ useSubmit }}>
      <CollectionProvider name="tests">
        <SchemaComponent schema={schema} />
      </CollectionProvider>
    </SchemaComponentOptions>
  );
});

const app = new Application({
  providers: [Root],
  components: { Action, Form, Input, FormItem },
  dataSourceManager: {
    collections: [collection],
    collectionMixins: [InheritanceCollectionMixin],
  },
});

export default app.getRootComponent();
