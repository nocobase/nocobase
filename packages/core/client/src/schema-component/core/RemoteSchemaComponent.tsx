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
import { useComponent, useSchemaComponentContext } from '../hooks';
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
  /**
   * @default true
   */
  memoized?: boolean;
  NotFoundPage?: React.ComponentType | string;
}

const defaultTransform = (s: Schema) => s;

const RequestSchemaComponent: React.FC<RemoteSchemaComponentProps> = (props) => {
  const {
    noForm,
    onlyRenderProperties,
    hidden,
    scope,
    uid,
    memoized = true,
    components,
    onSuccess,
    NotFoundPage,
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
  const NotFoundComponent = useComponent(NotFoundPage);
  if (loading || hidden) {
    return (
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Spin />
      </div>
    );
  }

  if (!schema || Object.keys(schema).length === 0) {
    return NotFoundComponent ? <NotFoundComponent /> : null;
  }

  return noForm ? (
    <SchemaComponent components={components} scope={scope} schema={schemaTransform(schema || {})} />
  ) : (
    <FormProvider form={form}>
      <SchemaComponent components={components} scope={scope} schema={schemaTransform(schema || {})} />
    </FormProvider>
  );
};

export const RemoteSchemaComponent: React.FC<RemoteSchemaComponentProps> = memo((props) => {
  return props.uid ? <RequestSchemaComponent {...props} /> : null;
});
RemoteSchemaComponent.displayName = 'RemoteSchemaComponent';
