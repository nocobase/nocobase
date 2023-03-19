import { useForm } from '@formily/react';
import { collectionTemplates, Select, useActionContext, useAPIClient, useRecord, useRequest } from '@nocobase/client';
import { applicationsTableActionColumnProperties } from '@nocobase/plugin-multi-app-manager/client';
import React from 'react';
import { TableTransfer } from './TableTransfer';

const AppSelect = (props) => {
  const { data, loading } = useRequest({
    resource: 'applications',
    action: 'list',
    params: {
      paginate: false,
    },
  });
  return (
    <Select
      {...props}
      mode={'multiple'}
      fieldNames={{ value: 'name', label: 'displayName' }}
      options={data?.data || []}
      loading={loading}
    />
  );
};

collectionTemplates.calendar.configurableProperties.syncToApps = {
  type: 'string',
  title: '{{ t("Sync to apps") }}',
  'x-decorator': 'FormItem',
  'x-component': AppSelect,
};

collectionTemplates.general.configurableProperties.syncToApps = {
  type: 'string',
  title: '{{ t("Sync to apps") }}',
  'x-decorator': 'FormItem',
  'x-component': AppSelect,
};

collectionTemplates.tree.configurableProperties.syncToApps = {
  type: 'string',
  title: '{{ t("Sync to apps") }}',
  'x-decorator': 'FormItem',
  'x-component': AppSelect,
};

const useShareCollectionAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  const api = useAPIClient();
  const record = useRecord();
  console.log(record);
  return {
    async run() {
      console.log(form.values.names);
      await api.request({
        url: `applications/${record.name}/collectionBlacklist`,
        data: form.values.names,
        method: 'post',
      });
      // ctx.setVisible(false);
      // form.reset();
    },
  };
};

applicationsTableActionColumnProperties['collection'] = {
  type: 'void',
  title: '{{t("Share collections")}}',
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
      title: '{{t("Share collections")}}',
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

export default (props) => {
  return <>{props.children}</>;
};
