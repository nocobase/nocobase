import { ArrayTable } from '@formily/antd';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useUpdateAction } from '../action-hooks';
import { useCollectionManager } from '../hooks';
import { IField } from '../interfaces/types';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import * as components from './components';

const getSchema = (schema: IField, record: any, compile): ISchema => {
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
        title: `${compile(record.__parent?.title)} - ${compile('{{ t("Edit field") }}')}`,
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
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      if (values.autoCreateReverseField) {
      } else {
        delete values.reverseField;
      }
      delete values.autoCreateReverseField;
      await resource.update({ filterByTk, values });
      ctx.setVisible(false);
      await form.reset();
      refresh();
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
  const [data, setData] = useState<any>({});
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <a
        onClick={async () => {
          const { data } = await api.resource('collections.fields', record.collectionName).get({
            filterByTk: record.name,
            appends: ['uiSchema', 'reverseField'],
          });
          setData(data?.data);
          const interfaceConf = getInterface(record.interface);
          const defaultValues: any = cloneDeep(data?.data) || {};
          if (!defaultValues?.reverseField) {
            defaultValues.autoCreateReverseField = false;
            defaultValues.reverseField = interfaceConf.default?.reverseField;
            set(defaultValues.reverseField, 'name', `f_${uid()}`);
            set(defaultValues.reverseField, 'uiSchema.title', record.__parent.title);
          }
          const schema = getSchema(
            {
              ...interfaceConf,
              default: defaultValues,
            },
            record,
            compile,
          );
          setSchema(schema);
          setVisible(true);
        }}
      >
        {t('Edit')}
      </a>
      <SchemaComponent
        schema={schema}
        components={{ ...components, ArrayTable }}
        scope={{ useUpdateCollectionField, showReverseFieldConfig: !data?.reverseField }}
      />
    </ActionContext.Provider>
  );
};
