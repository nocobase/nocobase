import { BlockInitializer, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';

export const BulkUpdateActionInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const schema = {
    type: 'void',
    title: '{{ t("Bulk update") }}',
    'x-component': 'Action',
    'x-use-component-props': 'useCustomizeBulkUpdateActionProps',
    'x-align': 'right',
    'x-acl-action': 'update',
    'x-decorator': 'ACLActionProvider',
    'x-acl-action-props': {
      skipScopeCheck: true,
    },
    'x-action': 'customize:bulkUpdate',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:bulkUpdate',
    'x-action-settings': {
      assignedValues: {},
      updateMode: 'selected',
      onSuccess: {
        manualClose: true,
        redirecting: false,
        successMessage: '{{t("Updated successfully")}}',
      },
    },
    'x-component-props': {
      icon: 'EditOutlined',
    },
  };
  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
