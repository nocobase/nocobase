import { BlockInitializer, useCollection } from '@nocobase/client';
import React from 'react';

export const CustomRequestInitializer: React.FC = (props) => {
  const collection = useCollection();

  const schema = {
    title: '{{ t("Custom request") }}',
    'x-component': 'Action',
    'x-action': 'customize:form:request',
    'x-designer': 'CustomRequestActionDesigner',
    'x-action-settings': {
      skipValidator: false,
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

  if (collection && schema['x-acl-action']) {
    schema['x-acl-action'] = `${collection.name}:${schema['x-acl-action']}`;
    schema['x-decorator'] = 'ACLActionProvider';
  }
  return <BlockInitializer {...props} schema={schema} />;
};
