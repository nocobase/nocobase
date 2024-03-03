import { PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd-v5';
import { useField, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Button } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContextProvider, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import { useCancelAction } from '../action-hooks';
import { useCollectionManager_deprecated } from '../hooks';
import { IField } from '../interfaces/types';
import { PreviewFields } from '../templates/components/PreviewFields';
import { PreviewTable } from '../templates/components/PreviewTable';
import * as components from './components';

const getSchema = (schema: IField, record: any, compile) => {
  if (!schema) {
    return;
  }

  const properties = cloneDeep(schema.properties) as any;

  if (schema.hasDefaultValue === true) {
    properties['defaultValue'] = cloneDeep(schema?.default?.uiSchema);
    properties['defaultValue']['title'] = compile('{{ t("Default value") }}');
    properties['defaultValue']['x-decorator'] = 'FormItem';
  }
  const initialValue: any = {
    name: `f_${uid()}`,
    ...cloneDeep(schema.default),
    interface: schema.name,
  };
  if (initialValue.reverseField) {
    initialValue.reverseField.name = `f_${uid()}`;
  }
  // initialValue.uiSchema.title = schema.title;
  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-component-props': {
          getContainer: '{{ getContainer }}',
        },
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
        title: `${compile('{{ t("Sync from database") }}')}`,
        properties: {
          schema: {
            type: 'string',
            'x-hidden': true,
            default: record?.schema,
          },
          viewName: {
            type: 'string',
            'x-hidden': true,
            default: record?.viewName,
          },
          fields: {
            type: 'array',
            'x-component': PreviewFields,
            'x-component-props': {
              ...record,
            },
            default: record.fields,
          },
          preview: {
            type: 'object',
            'x-component': PreviewTable,
            'x-component-props': {
              ...record,
            },
            'x-reactions': {
              dependencies: ['fields'],
              fulfill: {
                schema: {
                  'x-component-props': '{{{...record,...$form.values}}}', //任意层次属性都支持表达式
                },
              },
            },
          },
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
                  useAction: '{{ useSyncFromDatabase }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

const useSyncFromDatabase = () => {
  const form = useForm();
  const { refreshCM } = useCollectionManager_deprecated();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  const api = useAPIClient();
  const field = useField();
  return {
    async run() {
      await form.submit();
      field.data = field.data || {};
      field.data.loading = true;
      try {
        await api.resource(`collections`).setFields({
          filterByTk,
          values: form.values,
        });
        ctx.setVisible(false);
        await form.reset();
        field.data.loading = false;
        refresh();
        await refreshCM();
      } catch (error) {
        field.data.loading = false;
      }
    },
  };
};

export const SyncFieldsAction = (props) => {
  const record = useRecord();
  return <SyncFieldsActionCom item={record} {...props} />;
};

export const SyncFieldsActionCom = (props) => {
  const { scope, getContainer, item: record, children } = props;
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const compile = useCompile();
  const { t } = useTranslation();
  return (
    record.template === 'view' && (
      <RecordProvider record={record}>
        <ActionContextProvider value={{ visible, setVisible, drawerProps: { width: 900 } }}>
          {children || (
            <Button
              icon={<PlusOutlined />}
              onClick={(e) => {
                const schema = getSchema({}, record, compile);
                if (schema) {
                  setSchema(schema);
                  setVisible(true);
                }
              }}
            >
              {t('Sync from database')}
            </Button>
          )}
          <SchemaComponent
            schema={schema}
            components={{ ...components, ArrayTable }}
            scope={{
              getContainer,
              useCancelAction,
              createOnly: true,
              isOverride: false,
              useSyncFromDatabase,
              record,
              ...scope,
            }}
          />
        </ActionContextProvider>
      </RecordProvider>
    )
  );
};
