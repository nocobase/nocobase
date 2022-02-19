import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent } from '../../schema-component';
import { useCollectionManager } from '../hooks';
import { IField } from '../interfaces/types';

const getSchema = (schema: IField): ISchema => {
  if (!schema) {
    return;
  }
  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-decorator': 'Form',
        'x-decorator-props': {
          initialValue: {
            ...schema.default,
            name: `f_${uid()}`,
          },
        },
        title: '{{ t("Edit field") }}',
        properties: {
          type: {
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
          },
          'uiSchema.title': {
            type: 'number',
            title: '{{ t("Field display name") }}',
            required: true,
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
          name: {
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
            'x-disabled': true,
          },
          // @ts-ignore
          ...schema.properties,
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
                  useAction: '{{ useUpdateActionAndRefreshCM }}',
                },
              },
            },
          },
        },
      },
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
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <a
        onClick={async () => {
          const { data } = await api.resource('collections.fields', record.collectionName).get({
            filterByTk: record.name,
            appends: ['uiSchema'],
          });
          const schema = getSchema({
            ...getInterface(record.interface),
            default: data?.data,
          });
          setSchema(schema);
          setVisible(true);
        }}
      >
        {t('Edit')}
      </a>
      <SchemaComponent schema={schema} />
    </ActionContext.Provider>
  );
};
