import React from "react";
import { ActionInitializer } from "./ActionInitializer";

export const DetachActionInitializer = (props) => {
    const schema = {
      type: 'void',
      title: '{{ t("Detach") }}',
      'x-action': 'detach',
      'x-designer': 'Action.Designer',
      'x-component': 'Action',
      'x-component-props': {
        icon: 'PlusOutlined',
        openMode: 'drawer',
        type: 'primary',
      },
      properties: {
        drawer: {
          type: 'void',
          title: '{{ t("select record") }}',
          'x-component': 'Action.Container',
          'x-component-props': {
            className: 'nb-action-popup',
          },
          properties: {
            'x-component': 'TableSelectorInitializer',
          },
        },
      },
    };
    return <ActionInitializer {...props} schema={schema} />;
  };
