import { collectionTemplates, Select, useRequest } from '@nocobase/client';
import React from 'react';

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

export default (props) => {
  return <>{props.children}</>;
};
