import { uid } from '@formily/shared';
import { BlockInitializer } from '@nocobase/client';
import React from 'react';
import { useCustomRequestsResource } from '../hooks/useCustomRequestsResource';

export const CustomRequestInitializer: React.FC<any> = (props) => {
  const customRequestsResource = useCustomRequestsResource();

  const schema = {
    title: '{{ t("Custom request") }}',
    'x-component': 'CustomRequestAction',
    'x-action': 'customize:form:request',
    'x-designer': 'CustomRequestAction.Designer',
    'x-decorator': 'CustomRequestAction.Decorator',
    'x-uid': uid(),
    'x-action-settings': {
      onSuccess: {
        manualClose: false,
        redirecting: false,
        successMessage: '{{t("Request success")}}',
      },
    },
  };

  return (
    <BlockInitializer
      {...props}
      insert={async (s) => {
        await customRequestsResource.updateOrCreate({
          values: {
            key: s['x-uid'],
          },
          filterKeys: ['key'],
        });
        await props?.insert(s);
      }}
      schema={schema}
    />
  );
};
