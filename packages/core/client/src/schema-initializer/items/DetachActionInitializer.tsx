import React from "react";
import { ActionInitializer } from "./ActionInitializer";

export const DetachActionInitializer = (props) => {
    const schema = {
      type: 'void',
      title: '{{ t("Detach") }}',
      'x-action': 'detach',
      'x-designer': 'Action.Designer',
      'x-component': 'Action',
      'x-decorator': 'ACLActionProvider',
      'x-component-props': {
        icon: 'PlusOutlined',
        useProps: '{{ usePickActionProps }}',
      }
    };
    return <ActionInitializer {...props} schema={schema} />;
  };
