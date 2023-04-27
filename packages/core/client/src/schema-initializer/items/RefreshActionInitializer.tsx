import React from 'react';
import { ActionInitializer } from './ActionInitializer';

export const RefreshActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Refresh") }}',
    'x-action': 'refresh',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      icon: 'ReloadOutlined',
      useProps: '{{ useRefreshActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
