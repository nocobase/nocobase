import { ArrayTable } from '@formily/antd-v5';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import cloneDeep from 'lodash/cloneDeep';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { ActionContextProvider, SchemaComponent, useSchemaComponentContext } from '../../schema-component';
import { useUpdateAction } from '../action-hooks';
import * as components from './components';
import { CollectionFieldInterfaceOptions, useCollectionManagerV2 } from '../../application';

const getSchema = (schema: CollectionFieldInterfaceOptions): ISchema => {
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
                  useAction: '{{ ds.useUpdateAction }}',
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
  const cm = useCollectionManager();
  const { refresh } = useSchemaComponentContext();
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
      await run();
      await cm.reload(refresh);
    },
  };
};

export const EditSubFieldAction = (props) => {
  const record = useRecord();
  const cm = useCollectionManagerV2();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const api = useAPIClient();
  const { t } = useTranslation();
  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <a
        onClick={async () => {
          // const { data } = await api.resource('collections.fields', record.collectionName).get({
          //   filterByTk: record.name,
          //   appends: record.interface === 'subTable' ? ['uiSchema', 'children'] : ['uiSchema'],
          // });
          const schema = getSchema({
            ...cm.getCollectionFieldInterface(record.interface).getOptions(),
            default: record,
          });
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
    </ActionContextProvider>
  );
};
