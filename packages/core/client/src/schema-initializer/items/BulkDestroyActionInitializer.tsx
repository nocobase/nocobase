import React from "react";

import { ActionInitializer } from "./ActionInitializer";

export const BulkDestroyActionInitializer = (props) => {
    const schema = {
      title: '{{ t("Delete") }}',
      'x-action': 'destroy',
      'x-component': 'Action',
      'x-designer': 'Action.Designer',
      'x-component-props': {
        icon: 'DeleteOutlined',
        confirm: {
          title: "{{t('Delete record')}}",
          content: "{{t('Are you sure you want to delete it?')}}",
        },
        useProps: '{{ useBulkDestroyActionProps }}',
      },
    };
    return <ActionInitializer {...props} schema={schema} />;
  };
