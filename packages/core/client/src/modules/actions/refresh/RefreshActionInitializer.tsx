import React from 'react';
import { ActionInitializer } from '../../../schema-initializer/items/ActionInitializer';

export const RefreshActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Refresh") }}',
    'x-action': 'refresh',
    'x-component': 'Action',
    'x-use-component-props': 'useRefreshActionProps',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:refresh',
    'x-component-props': {
      icon: 'ReloadOutlined',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
