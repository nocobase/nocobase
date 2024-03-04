import { uid } from '@formily/shared';
import { BlockInitializer, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';
import { useCustomRequestsResource } from '../hooks/useCustomRequestsResource';

export const CustomRequestInitializer: React.FC<any> = (props) => {
  const customRequestsResource = useCustomRequestsResource();

  const schema = {
    title: '{{ t("Custom request") }}',
    'x-component': 'CustomRequestAction',
    'x-action': 'customize:form:request',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:customRequest',
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

  const itemConfig = useSchemaInitializerItem();
  return (
    <BlockInitializer
      {...itemConfig}
      item={itemConfig}
      onClick={async (s) => {
        // create a custom request
        await customRequestsResource.create({
          values: {
            key: s['x-uid'],
          },
        });
      }}
      schema={schema}
    />
  );
};
