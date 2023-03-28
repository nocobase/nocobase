import { PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd';
import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Button } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../../api-client';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useCancelAction } from '../action-hooks';
import { useCollectionManager } from '../hooks';
import { IField } from '../interfaces/types';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import * as components from './components';
import { useAPIClient } from '../../api-client';
import { PreviewFields } from '../templates/components/PreviewFields';

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
          fields: {
            type: 'object',
            'x-component': PreviewFields,
            'x-component-props': {
              ...record,
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
  const { refreshCM } = useCollectionManager();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  const api = useAPIClient();
  return {
    async run() {
      await form.submit();
      await api.resource(`collections`).setFields({
        filterByTk,
        values: form.values,
      });
      ctx.setVisible(false);
      await form.reset();
      refresh();
      await refreshCM();
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
        <ActionContext.Provider value={{ visible, setVisible }}>
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
        </ActionContext.Provider>
      </RecordProvider>
    )
  );
};
