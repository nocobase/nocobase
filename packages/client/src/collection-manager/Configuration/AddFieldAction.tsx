import { PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Dropdown, Menu } from 'antd';
import React, { useState } from 'react';
import { ActionContext, SchemaComponent, useCompile } from '../../schema-component';
import { useCollectionManager } from '../hooks';
import { IField } from '../interfaces/types';
import { options } from './interfaces';

const getSchema = (schema: IField): ISchema => {
  if (!schema) {
    return;
  }
  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-decorator': 'Form',
        'x-decorator-props': {
          initialValue: {
            interface: schema.name,
            ...schema.default,
            name: `f_${uid()}`,
          },
        },
        title: '{{ t("Add field") }}',
        properties: {
          // @ts-ignore
          ...schema.properties,
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            properties: {
              action1: {
                title: '{{ t("Cancel") }}',
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ cm.useCancelAction }}',
                },
              },
              action2: {
                title: '{{ t("Submit") }}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: '{{ cm.useCreateActionAndRefreshCM }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

export const AddFieldAction = () => {
  const { getInterface } = useCollectionManager();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const compile = useCompile();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Dropdown
        overlay={
          <Menu
            onClick={(info) => {
              const schema = getSchema(getInterface(info.key));
              setSchema(schema);
              setVisible(true);
            }}
          >
            {options.map((option) => {
              return (
                <Menu.SubMenu title={compile(option.label)}>
                  {option.children.map((child) => {
                    console.log(child);
                    return <Menu.Item key={child.name}>{compile(child.title)}</Menu.Item>;
                  })}
                </Menu.SubMenu>
              );
            })}
          </Menu>
        }
      >
        <Button icon={<PlusOutlined />} type={'primary'}>
          添加字段
        </Button>
      </Dropdown>
      <SchemaComponent schema={schema} components={{ ArrayTable }} />
    </ActionContext.Provider>
  );
};
