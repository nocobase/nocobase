/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { Button, Spin } from 'antd';
import { uid } from '@formily/shared';
import { ISchema, Schema, useForm, useFormEffects } from '@formily/react';
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
import { createForm, onFieldValueChange, onFormValuesChange } from '@formily/core';
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
  const newSchema = {
    type: 'void',
    'x-async': false,
    'x-component': 'Grid',
    'x-initializer': 'assignFieldValuesForm:configureFields',
    'x-uid': props.value,
  };
  const [schema, setSchema] = React.useState(null);
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
        effects() {
          onFormValuesChange((f) => {
            setValuesIn('params.values', toJS(f.values));
            setFormValueChanged(true);
          });
        },
      }),
    [workflow.executed],
  );

  useFormEffects(() => {
    onFieldValueChange('collection', async (field) => {
      form.clearFormGraph('*');
      await api.resource('uiSchemas').remove({ resourceIndex: value });
      await api.resource('uiSchemas').insert({
        values: newSchema,
      });
      setSchema({ ...newSchema, name: uid() });
    });
  });

  const schemaOptions = useSchemaOptionsContext();
  const { loading } = useRequest(async () => {
    if (!value) {
      return null;
    }
    const res = await api.request({ url: `uiSchemas:getJsonSchema/${value}` });
    if (res.data.data?.['x-uid'] === value) {
      setSchema(res.data.data);
    } else {
      await api.resource('uiSchemas').insert({
        values: newSchema,
      });
      setSchema({ ...newSchema, name: uid() });
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
                <SchemaComponent schema={schema as ISchema} components={{ AssignedField }} />
              </SchemaComponentOptions>
            </SchemaComponentProvider>
          </FormLayout>
        </FormProvider>
      </CollectionProvider>
    </CollectionManagerProvider>
  ) : null;
}
