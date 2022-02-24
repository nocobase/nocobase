import { ArrayTable } from '@formily/antd';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import cloneDeep from 'lodash/cloneDeep';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent, useActionContext, useFormBlockContext } from '../../schema-component';
import { useCollectionManager } from '../hooks';
import { IField } from '../interfaces/types';

const getSchema = (schema: IField): ISchema => {
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
        title: '{{ t("Edit field") }}',
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
                  useAction: '{{ useUpdateSubField }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

const useUpdateSubField = () => {
  const { form, parent } = useFormBlockContext();
  const ctx = useActionContext();
  return {
    async run() {
      await form.submit();
      const children = parent.form.values?.children?.slice?.();
      parent.form.setValuesIn(
        'children',
        children.map((child) => {
          if (child.name === form.values.name) {
            return cloneDeep(form.values);
          }
          return child;
        }),
      );
      ctx.setVisible(false);
    },
  };
};

export const EditSubFieldAction = (props) => {
  const record = useRecord();
  const { getInterface } = useCollectionManager();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const api = useAPIClient();
  const { t } = useTranslation();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <a
        onClick={async () => {
          // const { data } = await api.resource('fields.children', record.key).get({
          //   filterByTk: record.name,
          //   appends: ['uiSchema'],
          // });
          const schema = getSchema({
            ...getInterface(record.interface),
            default: {
              ...record,
            },
          });
          setSchema(schema);
          setVisible(true);
        }}
      >
        {t('Edit')}
      </a>
      <SchemaComponent schema={schema} components={{ ArrayTable }} scope={{ useUpdateSubField }} />
    </ActionContext.Provider>
  );
};
