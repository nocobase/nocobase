import { ArrayTable } from '@formily/antd';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import cloneDeep from 'lodash/cloneDeep';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EditOutlined } from '@ant-design/icons';

import {
  useAPIClient,
  APIClient,
  useRequest,
  ActionContext,
  SchemaComponent,
  useCompile,
  useCollectionManager,
} from '@nocobase/client';
// import { useRecord } from '../../record-provider';
// import { useCollectionManager } from '../hooks';
// import { IField } from '../interfaces/types';
import * as components from './configrations';
import { Typography } from 'antd';
import { FieldSummary } from './FieldSummary';
import {useUpdateFieldAction} from '../action-hooks'


const getSchema = (schema, collectionName: string, compile,name:string): ISchema => {
  if (!schema) {
    return;
  }
  const properties = cloneDeep(schema.properties) as any;
  properties.name['x-disabled'] = true;

  if (schema.hasDefaultValue === true) {
    properties['defaultValue'] = cloneDeep(schema.default.uiSchema);
    properties['defaultValue']['title'] = compile('{{ t("Default value") }}');
    properties['defaultValue']['x-decorator'] = 'FormItem';
  }

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
                  data: cloneDeep(schema.default),
                }),
              options,
            );
          },
        },
        title: `${compile(collectionName)} - ${compile('{{ t("Edit field") }}')}`,
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
                  useAction: '{{ useCancelAction }}',
                },
              },
              action2: {
                title: '{{ t("Submit") }}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: ()=>useUpdateCollectionField({collectionName,name}),
                },
              },
            },
          },
        },
      },
    },
  };
};

const useUpdateCollectionField = (props) => {
  const form = useForm();
  const { run } = useUpdateFieldAction(props);
  // const { refreshCM } = useCollectionManager();
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

      function recursiveChildren(children = [], prefix = 'children') {
        children.forEach((item, index) => {
          const itemOptions = item.uiSchema?.enum?.slice() || [];
          form.setValuesIn(
            `${prefix}[${index}].uiSchema.enum`,
            itemOptions.map((option) => {
              return {
                value: uid(),
                ...option,
              };
            }),
          );
          recursiveChildren(item.children, `${prefix}[${index}].children`);
        });
      }

      recursiveChildren(form?.values?.children);

      await run();
      // await refreshCM();
    },
  };
};

export const EditFieldAction = ({ item }) => {
  const { name, collectionName, interface: type } = item;
  const { getInterface } = useCollectionManager();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const compile = useCompile();
  const api = useAPIClient();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <a
        onClick={async () => {
          const { data } = await api.resource('collections.fields', collectionName).get({
            filterByTk: name,
            appends: type === 'subTable' ? ['uiSchema', 'children'] : ['uiSchema'],
          });
          const schema = getSchema(
            {
              ...getInterface(type),
              default: data?.data,
            },
            collectionName,
            compile,
            name,
          );
          setSchema(schema);
          setVisible(true);
        }}
      >
        <EditOutlined />
      </a>
      <SchemaComponent
        schema={schema}
        components={{ ...components, FieldSummary, ArrayTable }}
        scope={{ useUpdateCollectionField }}
      />
    </ActionContext.Provider>
  );
};
