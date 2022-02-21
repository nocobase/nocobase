import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import cloneDeep from 'lodash/cloneDeep';
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
          initialValue: cloneDeep(schema.default),
        },
        title: '{{ t("Edit field") }}',
        properties: {
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
                  useAction: '{{ cm.useCancelAction }}',
                },
              },
              action2: {
                title: '{{ t("Submit") }}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: '{{ cm.useUpdateActionAndRefreshCM }}',
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
