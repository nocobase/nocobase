import { useForm } from '@formily/react';
import { useActionContext, useAPIClient, useRecord } from '@nocobase/client';
import { tableActionColumnSchema } from '@nocobase/plugin-multi-app-manager/client';
import { message } from 'antd';
import React from 'react';
import { TableTransfer } from './TableTransfer';
import { i18nText } from './utils';

const useShareCollectionAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  const api = useAPIClient();
  const record = useRecord();
  return {
    async run() {
      console.log(form.values.names);
      await api.request({
        url: `applications/${record.name}/collectionBlacklist`,
        data: form.values.names,
        method: 'post',
      });
      ctx.setVisible(false);
      form.reset();
      message.success('Saved successfully');
    },
  };
};

const updateSchema = tableActionColumnSchema.properties['update'];
const deleteSchema = tableActionColumnSchema.properties['delete'];

delete tableActionColumnSchema.properties['update'];
delete tableActionColumnSchema.properties['delete'];

tableActionColumnSchema.properties['collection'] = {
  type: 'void',
  title: i18nText('Share collections'),
  'x-component': 'Action.Link',
  'x-component-props': {},
  properties: {
    drawer: {
      type: 'void',
      'x-component': 'Action.Drawer',
      'x-component-props': {
        width: '95vw',
      },
      'x-decorator': 'Form',
      title: i18nText('Share collections'),
      properties: {
        names: {
          type: 'array',
          'x-component': TableTransfer,
          'x-decorator': 'FormItem',
        },
        footer: {
          type: 'void',
          'x-component': 'Action.Drawer.Footer',
          properties: {
            cancel: {
              title: '{{t("Cancel")}}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ cm.useCancelAction }}',
              },
            },
            submit: {
              title: '{{t("Submit")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                useAction: useShareCollectionAction,
              },
            },
          },
        },
      },
    },
  },
};

tableActionColumnSchema.properties['update'] = updateSchema;
tableActionColumnSchema.properties['delete'] = deleteSchema;

export const MultiAppShareCollectionProvider = (props) => {
  return <>{props.children}</>;
};
