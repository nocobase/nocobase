/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Spin } from 'antd';
import { ISchema, useForm } from '@formily/react';
import {
  SchemaComponentProvider,
  useAPIClient,
  useRequest,
  SchemaComponent,
  useSchemaOptionsContext,
  SchemaComponentOptions,
  CollectionProvider,
  parseCollectionName,
  CollectionManagerProvider,
  FormProvider,
  Variable,
  CollectionField,
  useActionContext,
} from '@nocobase/client';
import { createForm, onFieldValueChange } from '@formily/core';
import { toJS } from '@formily/reactive';
import { FormLayout } from '@formily/antd-v5';
import { useWorkflowVariableOptions } from '../variable';
import { useFlowContext } from '../FlowContext';

function AssignedField(props) {
  const { value, onChange } = props;
  const scope = useWorkflowVariableOptions();
  return (
    <Variable.Input scope={scope} value={value} onChange={onChange}>
      <CollectionField {...props} />
    </Variable.Input>
  );
}

export function AssignedFieldsForm(props) {
  const { value } = props;
  const { workflow } = useFlowContext();
  const { setFormValueChanged } = useActionContext();
  const api = useAPIClient();
  const nodeForm = useForm();
  const { values, setValuesIn } = nodeForm;
  const params = toJS(values.params);
  const [dataSourceName, collectionName] = parseCollectionName(values.collection);

  const form = useMemo(
    () =>
      createForm({
        initialValues: params.values,
        disabled: workflow.executed,
        // values: params.values,
        effects() {
          onFieldValueChange('*', () => {
            // setValuesIn(`params.values[${field.path}]`, field.value);
            setValuesIn('params.values', toJS(form.values));
            setFormValueChanged(true);
          });
        },
      }),
    [values.collection, workflow],
  );

  const schemaOptions = useSchemaOptionsContext();
  const { data, loading } = useRequest(async () => {
    if (!value) {
      return null;
    }
    const res = await api.request({ url: `uiSchemas:getJsonSchema/${value}` });
    if (res.data.data?.['x-uid'] === value) {
      return res.data.data;
    } else {
      const newSchema = {
        type: 'void',
        'x-async': false,
        'x-component': 'Grid',
        'x-initializer': 'assignFieldValuesForm:configureFields',
        'x-uid': props.value,
        name: props.value,
      };
      await api.resource('uiSchemas').insert({
        values: newSchema,
      });
      return newSchema;
    }
  });

  if (loading) {
    return <Spin />;
  }

  return props.value ? (
    <CollectionManagerProvider dataSource={dataSourceName}>
      <CollectionProvider name={collectionName}>
        <FormProvider form={form}>
          <FormLayout layout={'vertical'}>
            <SchemaComponentProvider form={form} designable={!workflow.executed}>
              <SchemaComponentOptions {...schemaOptions}>
                <SchemaComponent schema={data as ISchema} components={{ AssignedField }} />
              </SchemaComponentOptions>
            </SchemaComponentProvider>
          </FormLayout>
        </FormProvider>
      </CollectionProvider>
    </CollectionManagerProvider>
  ) : null;
}
