import React, { useContext } from 'react';
import { SchemaInitializerContext, SchemaInitializerProvider } from '../schema-initializer';

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

export const ActionLogProvider = (props: any) => {
  const initializes = useContext(SchemaInitializerContext);
  initializes.BlockInitializers.items.push({ ...actionLogsItemGroup });
  return <SchemaInitializerProvider initializers={initializes}>{props.children}</SchemaInitializerProvider>;
};
