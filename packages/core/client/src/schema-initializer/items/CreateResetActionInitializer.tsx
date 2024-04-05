import React from 'react';

import { ActionInitializer } from './ActionInitializer';

export const CreateResetActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Reset") }}',
    'x-component': 'Action',
    'x-use-component-props': 'useResetBlockActionProps',
    'x-designer': 'Action.Designer',
  };
  return <ActionInitializer {...props} schema={schema} />;
};
