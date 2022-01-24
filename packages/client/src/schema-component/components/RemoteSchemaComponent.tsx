import { Schema } from '@formily/react';
import { Spin } from 'antd';
import React from 'react';
import { useRequest } from '../../api-client';
import { useSchemaComponentContext } from '../hooks';
import { SchemaComponent } from './SchemaComponent';

export interface RemoteSchemaComponentProps {
  scope?: any;
  uid?: string;
  onSuccess?: any;
  schemaTransform?: (schema: Schema) => Schema;
  render?: any;
  hidden?: any;
}

const defaultTransform = (s: Schema) => s;

const RequestSchemaComponent: React.FC<RemoteSchemaComponentProps> = (props) => {
  const { hidden, scope, uid, onSuccess, schemaTransform = defaultTransform } = props;
  const { reset } = useSchemaComponentContext();
  const { data, loading } = useRequest(
    {
      url: `/ui_schemas:getJsonSchema/${uid}`,
    },
    {
      refreshDeps: [uid],
      onSuccess(data) {
        onSuccess && onSuccess(data);
        reset && reset();
      },
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

export const RemoteSchemaComponent: React.FC<RemoteSchemaComponentProps> = (props) => {
  return props.uid ? <RequestSchemaComponent {...props}/> : null;
};
