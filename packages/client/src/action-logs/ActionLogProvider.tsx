import React from 'react';
import { SchemaInitializerProvider } from '../schema-initializer';
import { initializes } from '../schema-initializer/Initializers';

export const ActionLogProvider = (props: any) => {
  const actionLogsItemGroup = {
    type: 'itemGroup',
    title: '{{t("Others")}}',
    children: [
      {
        type: 'item',
        title: '{{t("Action logs")}}',
        component: 'ActionLogBlockInitializer',
      },
    ],
  };
  initializes.BlockInitializers.items.push({ ...actionLogsItemGroup });
  return <SchemaInitializerProvider initializers={initializes}>{props.children}</SchemaInitializerProvider>;
};
