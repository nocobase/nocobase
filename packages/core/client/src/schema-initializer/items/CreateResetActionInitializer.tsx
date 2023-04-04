import React from 'react';

import { ActionInitializer } from './ActionInitializer';

export const CreateResetActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Reset") }}',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      useProps: '{{ useResetBlockActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
