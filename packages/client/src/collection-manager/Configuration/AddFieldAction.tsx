import { PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Dropdown, Menu } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { useRequest } from '../../api-client';
import { ActionContext, SchemaComponent, useCompile } from '../../schema-component';
import { useCreateAction } from '../action-hooks';
import { useCollectionManager } from '../hooks';
import { IField } from '../interfaces/types';
import { options } from './interfaces';

const getSchema = (schema: IField): ISchema => {
  if (!schema) {
    return;
  }
  const properties = cloneDeep(schema.properties) as any;
  const initialValue = {
    ...cloneDeep(schema.default),
    interface: schema.name,
    name: `f_${uid()}`,
  };
  initialValue.uiSchema.title = schema.title;
  console.log('initialValue', initialValue);
  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-decorator': 'Form',
        'x-decorator-props': {
          useValues(options) {
            return useRequest(
              () =>
                Promise.resolve({
                  data: initialValue,
                }),
              options,
            );
          },
        },
        title: '{{ t("Add field") }}',
        properties: {
          // @ts-ignore
          ...properties,
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
                  useAction: '{{ useCreateCollectionField }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

const useCreateCollectionField = () => {
  const form = useForm();
  const { run } = useCreateAction();
  const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await form.submit();
      const options = form?.values?.uiSchema?.enum?.slice() || [];
      form.setValuesIn(
        'uiSchema.enum',
        options.map((option) => {
          return {
            value: uid(),
            ...option,
          };
        }),
      );
      console.log('form.values', form.values);
      await run();
      await refreshCM();
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
      <SchemaComponent schema={schema} components={{ ArrayTable }} scope={{ useCreateCollectionField }} />
    </ActionContext.Provider>
  );
};
