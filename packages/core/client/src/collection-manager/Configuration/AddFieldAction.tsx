import { PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Dropdown, Menu } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent, useCompile } from '../../schema-component';
import { useCreateAction } from '../action-hooks';
import { useCollectionManager } from '../hooks';
import { IField } from '../interfaces/types';
import * as components from './components';
import { options } from './interfaces';

const getSchema = (schema: IField, record: any, compile): ISchema => {
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
        title: `${compile(record.title)} - ${compile('{{ t("Add field") }}')}`,
        properties: {
          summary: {
            type: 'void',
            'x-component': 'FieldSummary',
            'x-component-props': {
              schemaKey: schema.name,
            },
          },
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
  const { title } = useRecord();
  return {
    async run() {
      await form.submit();
      // const options = form?.values?.uiSchema?.enum?.slice() || [];
      // if (options?.length) {
      //   form.setValuesIn(
      //     'uiSchema.enum',
      //     options.map((option) => {
      //       return {
      //         value: uid(),
      //         ...option,
      //       };
      //     }),
      //   );
      // }
      // function recursiveChildren(children = [], prefix = 'children') {
      //   children.forEach((item, index) => {
      //     const itemOptions = item.uiSchema?.enum?.slice() || [];
      //     form.setValuesIn(
      //       `${prefix}[${index}].uiSchema.enum`,
      //       itemOptions.map((option) => {
      //         return {
      //           value: uid(),
      //           ...option,
      //         };
      //       }),
      //     );
      //     recursiveChildren(item.children, `${prefix}[${index}].children`);
      //   });
      // }

      // recursiveChildren(form?.values?.children);

      if (['obo', 'oho', 'o2o', 'o2m', 'm2o', 'm2m', 'linkTo'].includes(form?.values?.interface) && title) {
        form.setValuesIn('reverseField.uiSchema.title', title);
      }

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
  const { t } = useTranslation();
  const record = useRecord();
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
              const schema = getSchema(getInterface(info.key), record, compile);
              setSchema(schema);
              setVisible(true);
            }}
          >
            {options.map((option) => {
              return (
                option.children.length > 0 && (
                  <Menu.ItemGroup key={option.label} title={compile(option.label)}>
                    {option.children
                      .filter((child) => !['o2o', 'subTable'].includes(child.name))
                      .map((child) => {
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
      <SchemaComponent
        schema={schema}
        components={{ ...components, ArrayTable }}
        scope={{ createOnly: true, useCreateCollectionField }}
      />
    </ActionContext.Provider>
  );
};
