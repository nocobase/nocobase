import React from 'react';

import { ActionInitializer } from '../../../schema-initializer/items/ActionInitializer';

export const UpdateSubmitActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Submit") }}',
    'x-action': 'submit',
    'x-component': 'Action',
    // 'x-designer': 'Action.Designer',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:updateSubmit',
    'x-component-props': {
      type: 'primary',
      htmlType: 'submit',
      useProps: '{{ useUpdateActionProps }}',
    },
    'x-action-settings': {
      triggerWorkflows: [],
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
