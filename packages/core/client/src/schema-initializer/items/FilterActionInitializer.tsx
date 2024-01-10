import React from 'react';

import { ActionInitializer } from './ActionInitializer';

export const FilterActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Filter") }}',
    'x-action': 'filter',
    'x-settings': 'actionSettings:refresh',
    'x-component': 'Filter.Action',
    'x-component-props': {
      icon: 'FilterOutlined',
      useProps: '{{ useFilterActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
