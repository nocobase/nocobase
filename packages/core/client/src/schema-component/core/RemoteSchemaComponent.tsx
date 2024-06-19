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
import React, { useMemo } from 'react';
import { useRequest } from '../../api-client';
import { useSchemaComponentContext } from '../hooks';
import { FormProvider } from './FormProvider';
import { SchemaComponent } from './SchemaComponent';

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
}

const defaultTransform = (s: Schema) => s;

const RequestSchemaComponent: React.FC<RemoteSchemaComponentProps> = (props) => {
  const {
    noForm,
    onlyRenderProperties,
    hidden,
    scope,
    uid,
    memoized,
    components,
    onSuccess,
    schemaTransform = defaultTransform,
  } = props;
  const { reset } = useSchemaComponentContext();
  const conf = {
    url: `/uiSchemas:${onlyRenderProperties ? 'getProperties' : 'getJsonSchema'}/${uid}`,
  };
  const form = useMemo(() => createForm(), [uid]);
  const { data, loading } = useRequest<{
    data: any;
  }>(conf, {
    refreshDeps: [uid],
    onSuccess(data) {
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
    <SchemaComponent
      memoized={memoized}
      components={components}
      scope={scope}
      schema={schemaTransform(data?.data || {})}
    />
  ) : (
    <FormProvider form={form}>
      <SchemaComponent
        memoized={memoized}
        components={components}
        scope={scope}
        schema={schemaTransform(data?.data || {})}
      />
    </FormProvider>
  );
};

export const RemoteSchemaComponent: React.FC<RemoteSchemaComponentProps> = (props) => {
  return props.uid ? <RequestSchemaComponent {...props} /> : null;
};
