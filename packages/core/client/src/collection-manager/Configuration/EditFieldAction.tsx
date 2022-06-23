import { ArrayTable } from '@formily/antd';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import cloneDeep from 'lodash/cloneDeep';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent, useCompile } from '../../schema-component';
import { useUpdateAction } from '../action-hooks';
import { useCollectionManager } from '../hooks';
import { IField } from '../interfaces/types';
import * as components from './components';
import { Typography } from 'antd';

const getSchema = (schema: IField, record: any, compile): ISchema => {
  if (!schema) {
    return;
  }
  const properties = cloneDeep(schema.properties) as any;
  properties.name['x-disabled'] = true;
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
        title: `${compile(record.__parent?.title)} - ${compile('{{ t("Edit field") }}')}`,
        properties: {
          summary: {
            type: 'void',
            'x-component': 'FieldSummary',
            'x-component-props': {
              schemaKey: schema.name
            }
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
                  useAction: '{{ useUpdateCollectionField }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

const useUpdateCollectionField = () => {
  const form = useForm();
  const { run } = useUpdateAction();
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
      await refreshCM();
    },
  };
};

export const EditFieldAction = (props) => {
  const record = useRecord();
  const { getInterface } = useCollectionManager();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const api = useAPIClient();
  const { t } = useTranslation();
  const compile = useCompile();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <a
        onClick={async () => {
          const { data } = await api.resource('collections.fields', record.collectionName).get({
            filterByTk: record.name,
            appends: record.interface === 'subTable' ? ['uiSchema', 'children'] : ['uiSchema'],
          });
          const schema = getSchema({
            ...getInterface(record.interface),
            default: data?.data,
          }, record, compile);
          setSchema(schema);
          setVisible(true);
        }}
      >
        {t('Edit')}
      </a>
      <SchemaComponent
        schema={schema}
        components={{ ...components, ArrayTable }}
        scope={{ useUpdateCollectionField }}
      />
    </ActionContext.Provider>
  );
};
