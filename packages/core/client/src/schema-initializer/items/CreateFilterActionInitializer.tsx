import React from 'react';

import { ActionInitializer } from './ActionInitializer';

export const CreateFilterActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Filter") }}',
    'x-action': 'submit',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      type: 'primary',
      htmlType: 'submit',
      useProps: '{{ useFilterBlockActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
