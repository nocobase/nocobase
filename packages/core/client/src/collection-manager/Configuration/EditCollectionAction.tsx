import { ArrayTable } from '@formily/antd-v5';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContextProvider, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import { useCancelAction } from '../action-hooks';
import { useCollectionManager_deprecated } from '../hooks';
import { IField } from '../interfaces/types';
import * as components from './components';

const getSchema = (schema: IField, record: any, compile, getContainer): ISchema => {
  if (!schema) {
    return;
  }
  const properties = (cloneDeep(schema.configurableProperties) as any) || {
    title: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
    },
    name: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
      // 'x-disabled': true,
    },
  };
  // properties.name['x-disabled'] = true;
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
          useValues: '{{ useValuesFromRecord }}',
        },
        title: '{{ t("Edit collection") }}',
        properties: {
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
                  useAction: '{{ useUpdateCollectionActionAndRefreshCM }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

export const useValuesFromRecord = (options) => {
  const record = useRecord();
  const result = useRequest(
    () =>
      Promise.resolve({
        data: {
          ...omit(cloneDeep(record), ['__parent', '__collectionName']),
          category: record?.category.map((v) => v.id),
        },
      }),
    {
      ...options,
      manual: true,
    },
  );
  const ctx = useActionContext();
  useEffect(() => {
    if (ctx.visible) {
      result.run();
    }
  }, [ctx.visible]);
  return result;
};

export const useUpdateCollectionActionAndRefreshCM = (options) => {
  const { refreshCM } = useCollectionManager_deprecated();
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk, template } = useRecord();
  const api = useAPIClient();
  const collectionResource = template === 'sql' ? api.resource('sqlCollection') : resource;
  return {
    async run() {
      await form.submit();
      await collectionResource.update({
        filterByTk,
        values: template === 'sql' ? form.values : omit(form.values, ['fields']),
      });
      ctx.setVisible(false);
      await form.reset();
      refresh();
      await refreshCM();
    },
  };
};

export const EditCollection = (props) => {
  const record = useRecord();
  return <EditCollectionAction item={record} {...props} />;
};

export const EditCollectionAction = (props) => {
  const { scope, getContainer, item: record, children, ...otherProps } = props;
  const { getTemplate } = useCollectionManager_deprecated();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const { t } = useTranslation();
  const compile = useCompile();

  return (
    <RecordProvider record={record}>
      <ActionContextProvider value={{ visible, setVisible }}>
        <a
          {...otherProps}
          onClick={async () => {
            const templateConf: any = getTemplate(record.template);
            const schema = getSchema(
              {
                ...templateConf,
              },
              record,
              compile,
              getContainer,
            );
            setSchema(schema);
            setVisible(true);
          }}
        >
          {children || t('Edit')}
        </a>
        <SchemaComponent
          schema={schema}
          components={{ ...components, ArrayTable }}
          scope={{
            getContainer,
            useValuesFromRecord,
            useUpdateCollectionActionAndRefreshCM,
            useCancelAction,
            createOnly: false,
            ...scope,
          }}
        />
      </ActionContextProvider>
    </RecordProvider>
  );
};
