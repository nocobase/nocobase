/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { Schema } from '@formily/react';
import { Spin } from 'antd';
import React, { memo, useMemo } from 'react';
import { useSchemaComponentContext } from '../hooks';
import { FormProvider } from './FormProvider';
import { SchemaComponent } from './SchemaComponent';
import { useRequestSchema } from './useRequestSchema';

export interface RemoteSchemaComponentProps {
  scope?: any;
  uid?: string;
  onSuccess?: any;
  components?: any;
  schemaTransform?: (schema: Schema) => Schema;
  render?: any;
  hidden?: any;
  onlyRenderProperties?: boolean;
  noForm?: boolean;
}

const defaultTransform = (s: Schema) => s;

const RequestSchemaComponent: React.FC<RemoteSchemaComponentProps> = (props) => {
  const {
    noForm,
    onlyRenderProperties,
    hidden,
    scope,
    uid,
    components,
    onSuccess,
    schemaTransform = defaultTransform,
  } = props;
  const { reset } = useSchemaComponentContext();
  const type = onlyRenderProperties ? 'getProperties' : 'getJsonSchema';
  const conf = {
    url: `/uiSchemas:${type}/${uid}`,
  };
  const form = useMemo(() => createForm(), [uid]);
  const { schema, loading } = useRequestSchema({
    uid,
    type,
    onSuccess: (data) => {
      onSuccess && onSuccess(data);
      reset && reset();
    },
  });
  if (loading) {
    return <Spin />;
  }
  if (hidden) {
    return <Spin />;
  }
  return noForm ? (
    <SchemaComponent memoized components={components} scope={scope} schema={schemaTransform(schema || {})} />
  ) : (
    <FormProvider form={form}>
      <SchemaComponent memoized components={components} scope={scope} schema={schemaTransform(schema || {})} />
    </FormProvider>
  );
};

export const RemoteSchemaComponent: React.FC<RemoteSchemaComponentProps> = memo((props) => {
  return props.uid ? <RequestSchemaComponent {...props} /> : null;
});
RemoteSchemaComponent.displayName = 'RemoteSchemaComponent';
