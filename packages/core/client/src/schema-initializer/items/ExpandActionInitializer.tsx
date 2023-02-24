import React from 'react';
import { ActionInitializer } from './ActionInitializer';

export const ExpandActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Collapse all") }}',
    'x-action': 'collapseAll',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      icon: 'NodeExpandOutlined',
      useProps: '{{ useCollapseAllActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
