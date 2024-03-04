import { ArrayTable } from '@formily/antd-v5';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useCollectionParentRecordData } from '../../data-source';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContextProvider, SchemaComponent, useCompile } from '../../schema-component';
import { useCollectionManager_deprecated } from '../hooks';
import { IField } from '../interfaces/types';
import * as components from './components';

const getSchema = (schema: IField, record: any, compile, getContainer): ISchema => {
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
        'x-component-props': {
          getContainer: '{{ getContainer }}',
        },
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
        title: `${compile(record.__parent?.title)} - ${compile('{{ t("View") }}')}`,
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
          description: {
            type: 'string',
            title: '{{t("Description")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
          },
        },
      },
    },
  };
};

export const ViewCollectionField = (props) => {
  const record = useRecord();
  const parentRecordData = useCollectionParentRecordData();
  return <ViewFieldAction item={record} parentItem={parentRecordData} {...props} />;
};

export const ViewFieldAction = (props) => {
  const { scope, getContainer, item: record, parentItem: parentRecord, children } = props;
  const { getInterface, collections } = useCollectionManager_deprecated();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const api = useAPIClient();
  const { t } = useTranslation();
  const compile = useCompile();
  const [data, setData] = useState<any>({});
  const currentCollections = useMemo(() => {
    return collections.map((v) => {
      return {
        label: compile(v.title),
        value: v.name,
      };
    });
  }, []);
  return (
    <RecordProvider record={record} parent={parentRecord}>
      <ActionContextProvider value={{ visible, setVisible }}>
        <a
          onClick={async () => {
            const { data } = await api.resource('collections.fields', record.collectionName).get({
              filterByTk: record.name,
              appends: ['reverseField'],
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
              getContainer,
            );
            setSchema(schema);
            setVisible(true);
          }}
        >
          {children || t('View')}
        </a>
        <SchemaComponent
          schema={schema}
          components={{ ...components, ArrayTable }}
          scope={{
            getContainer,
            showReverseFieldConfig: !data?.reverseField,
            createOnly: !true,
            collections: currentCollections,
            ...scope,
          }}
        />
      </ActionContextProvider>
    </RecordProvider>
  );
};
