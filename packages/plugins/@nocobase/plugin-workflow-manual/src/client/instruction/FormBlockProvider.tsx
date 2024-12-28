/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import {
  BlockProvider,
  BlockRequestContext_deprecated,
  CollectionManagerProvider,
  CollectionProvider_deprecated,
  DEFAULT_DATA_SOURCE_KEY,
  FormActiveFieldsProvider,
  FormBlockContext,
  FormV2,
  RecordProvider,
  RerenderDataBlockProvider,
  useAPIClient,
  useAssociationNames,
  useBlockRequestContext,
  useCollectionRecordData,
  useDataSourceHeaders,
} from '@nocobase/client';
import { theme } from 'antd';
import React, { useMemo, useRef } from 'react';

export function FormBlockProvider(props) {
  const userJob = useCollectionRecordData();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const formBlockRef = useRef(null);
  const dataSource = props.dataSource || DEFAULT_DATA_SOURCE_KEY;
  const { token } = theme.useToken();
  const { getAssociationAppends } = useAssociationNames(dataSource);
  const { appends, updateAssociationValues } = getAssociationAppends();
  const [formKey] = Object.keys(fieldSchema.toJSON().properties ?? {});
  const values = userJob?.result?.[formKey];

  const form = useMemo(
    () =>
      createForm({
        initialValues: values,
      }),
    [values],
  );

  const params = useMemo(() => {
    return {
      appends,
      ...props.params,
    };
  }, [appends, props.params]);
  const service = useMemo(() => {
    return {
      loading: false,
      data: {
        data: values,
      },
    };
  }, [values]);
  const api = useAPIClient();
  const headers = useDataSourceHeaders(dataSource);

  const resource = api.resource(props.collection, undefined, headers);
  const __parent = useBlockRequestContext();

  const formBlockValue = useMemo(() => {
    return {
      params,
      form,
      field,
      service,
      updateAssociationValues,
      formBlockRef,
    };
  }, [field, form, params, service, updateAssociationValues]);

  return !userJob?.status || values ? (
    <CollectionManagerProvider dataSource={dataSource}>
      <CollectionProvider_deprecated collection={props.collection}>
        <BlockProvider name={props.name || 'form'} {...props} block={'form'} parentRecord={null}>
          <FormActiveFieldsProvider name="form">
            <BlockRequestContext_deprecated.Provider
              value={{ block: 'form', props, field, service, resource, __parent }}
            >
              <FormBlockContext.Provider value={formBlockValue}>
                <RecordProvider record={values} parent={null}>
                  <FormV2.Templates style={{ marginBottom: token.margin }} form={form} />
                  <div ref={formBlockRef}>{props.children}</div>
                </RecordProvider>
              </FormBlockContext.Provider>
            </BlockRequestContext_deprecated.Provider>
          </FormActiveFieldsProvider>
        </BlockProvider>
      </CollectionProvider_deprecated>
    </CollectionManagerProvider>
  ) : null;
}
