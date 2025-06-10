/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { Schema, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { memo, useMemo } from 'react';
import { useRemoteCollectionManagerLoading } from '../../collection-manager/CollectionManagerProvider';
import { LOADING_DELAY } from '../../variables/constants';
import { useComponent } from '../hooks';
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
  onPageNotFind?: () => void;
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
    NotFoundPage,
    schemaTransform = defaultTransform,
    onPageNotFind,
  } = props;
  const type = onlyRenderProperties ? 'getProperties' : 'getJsonSchema';
  const form = useMemo(() => createForm(), [uid]);
  const { schema, loading } = useRequestSchema({
    uid,
    type,
    onSuccess: (data) => {
      onSuccess && onSuccess(data);
    },
  });
  const NotFoundComponent = useComponent(NotFoundPage);
  const collectionManagerLoading = useRemoteCollectionManagerLoading();
  const parentSchema = useFieldSchema();

  if (collectionManagerLoading || loading || hidden) {
    return <Spin style={{ width: '100%', marginTop: 20 }} delay={LOADING_DELAY} />;
  }

  if (!schema || Object.keys(schema).length === 0) {
    onPageNotFind && onPageNotFind();
    return NotFoundComponent ? <NotFoundComponent /> : null;
  }

  return noForm ? (
    <SchemaComponent
      components={components}
      scope={scope}
      schema={schemaTransform(schema || {})}
      parentSchema={parentSchema}
    />
  ) : (
    <FormProvider form={form}>
      <SchemaComponent
        components={components}
        scope={scope}
        schema={schemaTransform(schema || {})}
        parentSchema={parentSchema}
      />
    </FormProvider>
  );
};

export const RemoteSchemaComponent: React.FC<RemoteSchemaComponentProps> = memo((props) => {
  return props.uid ? <RequestSchemaComponent {...props} /> : null;
});

RemoteSchemaComponent.displayName = 'RemoteSchemaComponent';
