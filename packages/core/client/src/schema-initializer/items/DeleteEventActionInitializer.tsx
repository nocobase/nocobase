import React from 'react';

import { ActionInitializer } from './ActionInitializer';

export const DeleteEventActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Delete Event") }}',
    'x-action': 'deleteEvent',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      icon: 'DeleteOutlined',
    },
    properties: {
      modal: {
        'x-component': 'CalendarV2.DeleteEvent',
      },
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
