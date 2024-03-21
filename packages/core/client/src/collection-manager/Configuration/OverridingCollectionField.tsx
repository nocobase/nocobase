import { ArrayTable } from '@formily/antd-v5';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { omit, set } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useCollectionParentRecordData } from '../../data-source';
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
        title: `${compile(record.__parent?.title)} - ${compile('{{ t("Override field") }}')}`,
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
                  useAction: '{{ useOverridingCollectionField }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

const useOverridingCollectionField = () => {
  const form = useForm();
  const { refreshCM } = useCollectionManager_deprecated();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      const data = omit(values, [
        'key',
        'uiSchemaUid',
        'collectionName',
        'autoCreateReverseField',
        'uiSchema.x-uid',
        'reverseField',
        'reverseKey',
        'parentKey',
        // 'reverseField.key',
        // 'reverseField.uiSchemaUid',
      ]);
      await resource.create({
        values: data,
      });
      ctx.setVisible(false);
      await form.reset();
      refresh();
      await refreshCM();
    },
  };
};

export const OverridingCollectionField = (props) => {
  const record = useRecord();
  const parentRecordData = useCollectionParentRecordData();
  return <OverridingFieldAction item={record} parentItem={parentRecordData} {...props} />;
};

const getIsOverriding = (currentFields, record) => {
  const flag = currentFields.find((v) => {
    return v.name === record.name;
  });
  return flag;
};
export const OverridingFieldAction = (props) => {
  const { scope, getContainer, item: record, parentItem: parentRecord, children, currentCollection } = props;
  const { target, through } = record;
  const { getInterface, getCurrentCollectionFields, getChildrenCollections, collections } =
    useCollectionManager_deprecated();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const api = useAPIClient();
  const { t } = useTranslation();
  const compile = useCompile();
  const getFilterCollections = (filterKey) => {
    const childCollections =
      filterKey &&
      getChildrenCollections(filterKey)
        ?.map((v) => v.name)
        .concat([filterKey]);
    return childCollections;
  };
  const [data, setData] = useState<any>({});
  const currentFields = getCurrentCollectionFields(currentCollection);
  const disabled = getIsOverriding(currentFields, record);
  const currentCollections = useMemo(() => {
    return collections.map((v) => {
      return {
        label: compile(v.title),
        value: v.name,
      };
    });
  }, []);
  return (
    <RecordProvider record={{ ...record, collectionName: parentRecord.name }} parent={parentRecord}>
      <ActionContextProvider value={{ visible, setVisible }}>
        <a
          //@ts-ignore
          disabled={disabled}
          onClick={async () => {
            if (!disabled) {
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
            }
          }}
        >
          {children || t('Override')}
        </a>
        <SchemaComponent
          schema={schema}
          components={{ ...components, ArrayTable }}
          scope={{
            getContainer,
            useOverridingCollectionField,
            useCancelAction,
            showReverseFieldConfig: !data?.reverseField,
            createOnly: true,
            override: true,
            isOverride: true,
            targetScope: { target: getFilterCollections(target), through: getFilterCollections(through) },
            collections: currentCollections,

            ...scope,
          }}
        />
      </ActionContextProvider>
    </RecordProvider>
  );
};
