import React from 'react';

import { ActionInitializer } from '../../../schema-initializer/items/ActionInitializer';

export const DisassociateActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Disassociate") }}',
    'x-action': 'disassociate',
    'x-component': 'Action',
    'x-use-component-props': 'useDisassociateActionProps',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:disassociate',
    'x-component-props': {
      icon: 'DeleteOutlined',
      confirm: {
        title: "{{t('Disassociate record')}}",
        content: "{{t('Are you sure you want to disassociate it?')}}",
      },
    },
    'x-action-settings': {
      triggerWorkflows: [],
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
