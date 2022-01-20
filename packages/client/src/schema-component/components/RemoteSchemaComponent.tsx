import React from 'react';
import { Spin } from 'antd';
import { useRequest } from '../../api-client';
import { SchemaComponent } from './SchemaComponent';
import { Schema } from '@formily/react';

export interface RemoteSchemaComponentProps {
  scope?: any;
  uid?: string;
  onSuccess?: any;
  schemaTransform?: (schema: Schema) => Schema;
  render?: any;
  hidden?: any;
}

const defaultTransform = (s: Schema) => s;

export const RemoteSchemaComponent: React.FC<RemoteSchemaComponentProps> = (props) => {
  const { hidden, scope, uid, onSuccess, schemaTransform = defaultTransform } = props;
  if (!uid) {
    return null;
  }
  const { data, loading } = useRequest(
    {
      url: `/ui_schemas:getJsonSchema/${uid}`,
    },
    {
      refreshDeps: [uid],
      onSuccess,
    },
  );
  if (loading) {
    return <Spin />;
  }
  if (hidden) {
    return <Spin />;
  }
  return <SchemaComponent scope={scope} schema={schemaTransform(data?.data || {})} />;
};
