import React from 'react';
import { ActionInitializer } from '@nocobase/client';

export const BulkEditSubmitActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Submit") }}',
    'x-action': 'submit',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      type: 'primary',
      htmlType: 'submit',
      useProps: '{{ useCustomizeBulkEditActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
