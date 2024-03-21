import React from 'react';
import { useCollection_deprecated } from '../../../collection-manager';

import { ActionInitializer } from '../../../schema-initializer/items/ActionInitializer';

export const BulkDestroyActionInitializer = (props) => {
  const collection = useCollection_deprecated();
  const schema = {
    title: '{{ t("Delete") }}',
    'x-action': 'destroy',
    'x-component': 'Action',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:bulkDelete',
    'x-decorator': 'ACLActionProvider',
    'x-acl-action-props': {
      skipScopeCheck: true,
    },
    'x-component-props': {
      icon: 'DeleteOutlined',
      confirm: {
        title: "{{t('Delete record')}}",
        content: "{{t('Are you sure you want to delete it?')}}",
      },
      useProps: '{{ useBulkDestroyActionProps }}',
    },
    'x-action-settings': {
      triggerWorkflows: [],
    },
  };
  if (collection) {
    schema['x-acl-action'] = `${collection.name}:destroy`;
  }
  return <ActionInitializer {...props} schema={schema} />;
};
