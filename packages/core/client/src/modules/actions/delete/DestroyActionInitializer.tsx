import React from 'react';

import { ActionInitializer } from '../../../schema-initializer/items/ActionInitializer';

export const DestroyActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Delete") }}',
    'x-action': 'destroy',
    'x-component': 'Action',
    'x-use-component-props': 'useDestroyActionProps',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:delete',
    'x-component-props': {
      icon: 'DeleteOutlined',
      confirm: {
        title: "{{t('Delete record')}}",
        content: "{{t('Are you sure you want to delete it?')}}",
      },
    },
    'x-action-settings': {
      triggerWorkflows: [],
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
