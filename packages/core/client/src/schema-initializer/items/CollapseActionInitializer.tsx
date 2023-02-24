import React from 'react';
import { ActionInitializer } from './ActionInitializer';

export const CollapseActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Expand all") }}',
    'x-action': 'expandAll',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      icon: 'NodeCollapseOutlined',
      useProps: '{{ useExpandAllActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
