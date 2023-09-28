import { BlockInitializer } from '@nocobase/client';
import React from 'react';

export const CustomRequestInitializer: React.FC = (props) => {
  const schema = {
    title: '{{ t("Custom request") }}',
    'x-component': 'CustomRequestAction',
    'x-action': 'customize:form:request',
    'x-designer': 'CustomRequestAction.Designer',
    'x-decorator': 'CustomRequestAction.Decorator',
    'x-action-settings': {
      onSuccess: {
        manualClose: false,
        redirecting: false,
        successMessage: '{{t("Request success")}}',
      },
    },
    'x-component-props': {
      useProps: '{{ useCustomizeRequestActionProps }}',
    },
  };

  return <BlockInitializer {...props} schema={schema} />;
};
