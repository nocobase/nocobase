import { ArrayTable } from '@formily/antd-v5';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import {
  ActionContextProvider,
  IField,
  RecordProvider,
  SchemaComponent,
  tval,
  useAPIClient,
  useActionContext,
  useCollectionManager_deprecated,
  useCompile,
  useRecord,
  useRequest,
  useResourceActionContext,
  useResourceContext,
  useCancelAction,
  useDataSourceManager,
} from '@nocobase/client';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { NAMESPACE } from '../../locale';

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
          ...omit(properties, 'category', 'inherits', 'moreOptions'),
          filterTargetKey: {
            title: `{{ t("Filter target key",{ ns: "${NAMESPACE}" }) }}`,
            type: 'single',
            description: tval(
              'Filter data based on the specific field, with the requirement that the field value must be unique.',
              { ns: NAMESPACE },
            ),
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            enum: '{{filterTargetKeyOptions}}',
            'x-visible': '{{!!isView}}',
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
          category: record?.category?.map((v) => v.id),
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
  const { name } = useParams();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  const api = useAPIClient();
  const dm = useDataSourceManager();
  return {
    async run() {
      await form.submit();
      await api.request({
        url: `dataSources/${name}/collections:update?filterByTk=${filterByTk}`,
        method: 'post',
        data: {
          ...omit(form.values, ['fields', 'autoGenId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'sortable']),
        },
      });
      await dm.getDataSource(name).reload();
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

const EditCollectionAction = (props) => {
  const { scope, getContainer, item: record, children, ...otherProps } = props;
  const { getTemplate } = useCollectionManager_deprecated();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const { t } = useTranslation();
  const compile = useCompile();

  const filterTargetKeyOptions = record.fields?.map((item: any) => {
    return {
      label: item.uiSchema?.title ? compile(item.uiSchema.title) : item.name,
      value: item.name,
    };
  });
  return (
    <RecordProvider record={record}>
      <ActionContextProvider value={{ visible, setVisible }}>
        <a
          {...otherProps}
          onClick={async () => {
            const templateConf = getTemplate(record.template);
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
          components={{ ArrayTable }}
          scope={{
            getContainer,
            useValuesFromRecord,
            useUpdateCollectionActionAndRefreshCM,
            useCancelAction,
            createOnly: false,
            filterTargetKeyOptions,
            isView: record.view,
            ...scope,
          }}
        />
      </ActionContextProvider>
    </RecordProvider>
  );
};
