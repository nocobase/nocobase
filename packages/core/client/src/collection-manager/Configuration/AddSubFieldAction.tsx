import { PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Dropdown, Menu } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../../api-client';
import { RecordProvider } from '../../record-provider';
import { ActionContext, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useCollectionManager } from '../hooks';
import { IField } from '../interfaces/types';
import * as components from './components';
import { options } from './interfaces';

const getSchema = (schema: IField): ISchema => {
  if (!schema) {
    return;
  }
  const properties = cloneDeep(schema.properties) as any;
  const initialValue = {
    name: `f_${uid()}`,
    ...cloneDeep(schema.default),
    interface: schema.name,
  };
  // initialValue.uiSchema.title = schema.title;
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
                  useAction: '{{ ds.useCreateAction }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

const useCreateSubField = () => {
  const ctx = useActionContext();
  return {
    async run() {
      // const options = form?.values?.uiSchema?.enum?.slice() || [];
      // form.setValuesIn(
      //   'uiSchema.enum',
      //   options.map((option) => {
      //     return {
      //       value: uid(),
      //       ...option,
      //     };
      //   }),
      // );
      // await run();
      // await refreshCM();
    },
  };
};

export const AddSubFieldAction = () => {
  const { getInterface } = useCollectionManager();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const compile = useCompile();
  const { t } = useTranslation();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Dropdown
        overlay={
          <Menu
            style={{
              maxHeight: '60vh',
              overflow: 'auto',
            }}
            onClick={(info) => {
              const schema = getSchema(getInterface(info.key));
              setSchema(schema);
              setVisible(true);
            }}
          >
            {options.map((option) => {
              return (
                option.children.length > 0 && (
                  <Menu.ItemGroup title={compile(option.label)}>
                    {option.children.map((child) => {
                      return <Menu.Item key={child.name}>{compile(child.title)}</Menu.Item>;
                    })}
                  </Menu.ItemGroup>
                )
              );
            })}
          </Menu>
        }
      >
        <Button icon={<PlusOutlined />} type={'primary'}>
          {t('Add field')}
        </Button>
      </Dropdown>
      <RecordProvider record={{}}>
        <SchemaComponent schema={schema} components={{ ...components, ArrayTable }} scope={{ createOnly: true, useCreateSubField }} />
      </RecordProvider>
    </ActionContext.Provider>
  );
};
