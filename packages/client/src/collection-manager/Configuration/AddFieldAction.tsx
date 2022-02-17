import { PlusOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Dropdown, Menu } from 'antd';
import React, { useState } from 'react';
import { useAPIClient } from '../../api-client';
import { useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent } from '../../schema-component';
import { useCollectionManager } from '../hooks';
import { IField } from '../interfaces/types';

const getSchema = (schema: IField, useAction): ISchema => {
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
            ...schema.default,
            name: `f_${uid()}`,
          },
        },
        title: 'Drawer Title',
        properties: {
          type: {
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
          },
          'uiSchema.title': {
            type: 'number',
            title: '字段名称',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
          name: {
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
          },
          // @ts-ignore
          ...schema.properties,
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            properties: {
              action1: {
                title: 'Cancel',
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ useCancelAction }}',
                },
              },
              action2: {
                title: 'Submit',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction,
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
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Dropdown
        overlay={
          <Menu
            onClick={(info) => {
              const schema = getSchema(getInterface(info.key), '{{ useCreateActionAndRefreshCM }}');
              setSchema(schema);
              setVisible(true);
            }}
          >
            <Menu.SubMenu title={'基本类型'}>
              <Menu.Item key={'input'}>input</Menu.Item>
              <Menu.Item key={'textarea'}>textarea</Menu.Item>
              <Menu.Item key={'chinaRegion'}>China region</Menu.Item>
            </Menu.SubMenu>
          </Menu>
        }
      >
        <Button icon={<PlusOutlined />} type={'primary'}>
          添加字段
        </Button>
      </Dropdown>
      <SchemaComponent schema={schema} />
    </ActionContext.Provider>
  );
};

export const EditFieldAction = (props) => {
  const record = useRecord();
  const { getInterface } = useCollectionManager();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const api = useAPIClient();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <a
        onClick={async () => {
          const { data } = await api.resource('collections.fields', record.collectionName).get({
            filterByTk: record.name,
            appends: ['uiSchema'],
          });
          const schema = getSchema(
            {
              ...getInterface(record.interface),
              default: data?.data,
            },
            '{{ useUpdateActionAndRefreshCM }}',
          );
          setSchema(schema);
          setVisible(true);
        }}
      >
        编辑
      </a>
      <SchemaComponent schema={schema} />
    </ActionContext.Provider>
  );
};
