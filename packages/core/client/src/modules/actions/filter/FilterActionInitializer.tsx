import React from 'react';

import { ActionInitializer } from '../../../schema-initializer/items/ActionInitializer';

export const FilterActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Filter") }}',
    'x-action': 'filter',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:filter',
    'x-component': 'Filter.Action',
    'x-use-component-props': 'useFilterActionProps',
    'x-component-props': {
      icon: 'FilterOutlined',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
