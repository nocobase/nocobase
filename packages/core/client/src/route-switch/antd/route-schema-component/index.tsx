import React from 'react';
import { useParams } from 'react-router-dom';
import { RemoteSchemaComponent } from '../../../';

export function RouteSchemaComponent(props: any) {
  const params = useParams<any>();
  return <RemoteSchemaComponent onlyRenderProperties uid={params.name} />;
}
