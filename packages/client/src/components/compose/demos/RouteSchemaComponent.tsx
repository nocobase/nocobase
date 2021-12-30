import React from 'react';
import { SchemaComponent, useRoute } from '@nocobase/client';

export const RouteSchemaComponent = () => {
  const route = useRoute();
  return <SchemaComponent schema={route.schema} />;
};
