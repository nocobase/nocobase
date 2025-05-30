/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayTable } from '@formily/antd-v5';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';
import set from 'lodash/set';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { CollectionFieldInterface } from '../../data-source';
import { useCollectionParentRecordData } from '../../data-source/collection-record/CollectionRecordProvider';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContextProvider, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import { useCancelAction } from '../action-hooks';
import { useCollectionManager_deprecated } from '../hooks';
import useDialect from '../hooks/useDialect';
import * as components from './components';

const getSchema = (
  schema: CollectionFieldInterface,
  defaultValues: any,
  record: any,
  compile,
  getContainer,
): ISchema => {
  if (!schema) {
    return;
  }
  const properties = schema.getConfigureFormProperties();
  if (properties?.name) {
    properties.name['x-disabled'] = true;
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
                  data: cloneDeep(omit(defaultValues, ['uiSchema.rawTitle'])),
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
  const { refreshCM } = useCollectionManager_deprecated();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      if (values.autoCreateReverseField) {
        /* empty */
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

export const EditCollectionField = (props) => {
  const record = useRecord();
  const parentRecordData = useCollectionParentRecordData();
  return <EditFieldAction item={record} parentItem={parentRecordData} {...props} />;
};

export const EditFieldAction = (props) => {
  const { scope, getContainer, item: record, parentItem: parentRecord, children, ...otherProps } = props;
  const { getInterface, collections, getCollection } = useCollectionManager_deprecated();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const api = useAPIClient();
  const { t } = useTranslation();
  const compile = useCompile();
  const [data, setData] = useState<any>({});
  const { isDialect } = useDialect();
  const { template } = parentRecord || {};

  const scopeKeyOptions = useMemo(() => {
    return (
      record?.fields ||
      getCollection(record.collectionName)
        ?.options.fields.filter((v) => {
          return ['string', 'bigInt', 'integer'].includes(v.type);
        })
        .map((k) => {
          return {
            value: k.name,
            label: compile(k.uiSchema?.title),
          };
        })
    );
  }, [record.name]);

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
          {...otherProps}
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
              defaultValues.reverseField = interfaceConf?.default?.reverseField;
              set(defaultValues.reverseField, 'name', `f_${uid()}`);
              set(defaultValues.reverseField, 'uiSchema.title', record.__parent?.title);
            } else {
              defaultValues.autoCreateReverseField = true;
            }
            const schema = getSchema(interfaceConf, defaultValues, record, compile, getContainer);
            setSchema(schema);
            setVisible(true);
          }}
        >
          {children || t('Edit')}
        </a>
        <SchemaComponent
          schema={schema}
          distributed={false}
          components={{ ...components, ArrayTable }}
          scope={{
            getContainer,
            useUpdateCollectionField,
            useCancelAction,
            showReverseFieldConfig: !data?.reverseField,
            collections: currentCollections,
            isDialect,
            disabledJSONB: true,
            scopeKeyOptions,
            createMainOnly: false,
            ...scope,
          }}
        />
      </ActionContextProvider>
    </RecordProvider>
  );
};
