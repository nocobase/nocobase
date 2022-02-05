import React from 'react';
import { RemoteSchemaComponent, useRoute } from '../../../';

export function RouteSchemaComponent(props: any) {
  const route = useRoute();
  return <RemoteSchemaComponent uid={route.uiSchemaUid} />;
}
