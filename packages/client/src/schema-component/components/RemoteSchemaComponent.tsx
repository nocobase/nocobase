import React from 'react';
import { Spin } from 'antd';
import { useRequest } from '../../api-client';
import { SchemaComponent } from './SchemaComponent';
import { Schema } from '@formily/react';

export interface RemoteSchemaComponentProps {
  scope?: any;
  uid?: string;
  transform?: (schema: Schema) => Schema;
}

const defaultTransform = (s: Schema) => s;

export const RemoteSchemaComponent: React.FC<RemoteSchemaComponentProps> = (props) => {
  const { scope, uid, transform = defaultTransform } = props;
  if (!uid) {
    return null;
  }
  const { data, loading } = useRequest(
    {
      url: `/ui_schemas:getJsonSchema/${uid}`,
    },
    {
      refreshDeps: [uid],
    },
  );
  if (loading) {
    return <Spin />;
  }
  return <SchemaComponent scope={scope} schema={transform(data?.data || {})} />;
};
