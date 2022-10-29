import React from 'react';

import { ActionInitializer } from './ActionInitializer';

export const DestroyEventActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Delete Event") }}',
    'x-action': 'destroy',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      icon: 'DeleteOutlined',
      // useProps: '{{ useDestroyActionProps }}',
    },
    properties: {
      modal: {
        'x-component': 'CalendarV2.DeleteEvent',
      },
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
