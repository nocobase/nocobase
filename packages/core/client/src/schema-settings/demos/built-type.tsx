import React from 'react';
import { Input } from 'antd';
import {
  Application,
  FormItem,
  SchemaComponentOptions,
  SchemaComponentPlugin,
  SchemaSettings,
  useSchemaSettingsRender,
} from '@nocobase/client';

const mySchemaSetting = new SchemaSettings({
  name: 'MySchemaSetting',
  items: [
    {
      name: 'demo1', // 唯一标识
      type: 'item', // 文本类型
      componentProps: {
        title: 'Text',
        onClick() {
          alert('Text');
        },
      },
    },
    {
      name: 'demo2',
      type: 'subMenu', // 子菜单
      componentProps: {
        title: 'Sub Menu',
      },
      children: [
        {
          name: 'demo3',
          type: 'switch', // Switch
          componentProps: {
            title: 'Switch1',
          },
        },
        {
          name: 'demo4',
          type: 'switch',
          componentProps: {
            title: 'Switch2',
          },
        },
      ],
    },
    {
      name: 'demo5',
      type: 'divider', // 分割线
    },
    {
      name: 'demo6',
      type: 'itemGroup', // 分组
      componentProps: {
        title: 'Group',
      },
      children: [
        {
          name: 'demo7',
          type: 'select', // Switch
          componentProps: {
            title: 'Select1',
            options: [
              {
                label: 'a',
                value: 'a',
              },
              {
                label: 'b',
                value: 'b',
              },
            ],
          },
        },
        {
          name: 'demo8',
          type: 'cascader', // 级联
          componentProps: {
            title: 'Cascader',
            options: [
              {
                label: 'zhejiang',
                value: 'Zhejiang',
                children: [
                  {
                    value: 'hangzhou',
                    label: 'Hangzhou',
                  },
                ],
              },
            ],
          },
        },
      ],
    },
    {
      name: 'demo9',
      type: 'modal',
      componentProps: {
        title: 'Modal',
        schema: {
          type: 'object',
          title: 'Edit button',
          properties: {
            title: {
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              title: 'Button title',
              default: 'aaa',
              'x-component-props': {},
            },
          },
        },
        onSubmit() {
          alert(123);
        },
      },
    },
  ],
});

const DemoRoot = () => {
  const { render } = useSchemaSettingsRender('MySchemaSetting');
  return (
    <SchemaComponentOptions components={{ Input, FormItem }}>
      <div style={{ width: 100 }}>{render()}</div>
    </SchemaComponentOptions>
  );
};

const app = new Application({
  schemaSettings: [mySchemaSetting],
  providers: [DemoRoot],
  plugins: [SchemaComponentPlugin],
});

export default app.getRootComponent();
