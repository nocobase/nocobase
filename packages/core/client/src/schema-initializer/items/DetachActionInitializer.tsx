import React from 'react';
import { ActionInitializer } from './ActionInitializer';

export const DetachActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Detach") }}',
    'x-action': 'remove',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      confirm: {
        title: "{{t('Detach')}}",
        content: "{{t('Are you sure you want to detach it?')}}",
      },
      useProps: '{{ useDetachActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
