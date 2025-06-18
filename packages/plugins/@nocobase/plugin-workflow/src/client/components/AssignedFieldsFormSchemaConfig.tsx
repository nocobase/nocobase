/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { createForm, onFieldValueChange, onFormValuesChange } from '@formily/core';
import { FormLayout } from '@formily/antd-v5';
import { toJS } from '@formily/reactive';
import { Schema, useForm, useFormEffects } from '@formily/react';
import { uid } from '@formily/shared';

import {
  CollectionField,
  CollectionManagerProvider,
  CollectionProvider,
  FormProvider,
  RerenderDataBlockProvider,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaComponentProvider,
  Variable,
  VariableScopeProvider,
  parseCollectionName,
  useAPIClient,
  useActionContext,
  useSchemaOptionsContext,
} from '@nocobase/client';

import { useFlowContext } from '../FlowContext';
import { useWorkflowVariableOptions } from '../variable';
import { Card } from 'antd';
import { useWorkflowExecuted } from '../hooks';

function reduceSchema(s, fn) {
  fn(s);
  if (s?.properties) {
    Object.values(s.properties).forEach((value) => {
      reduceSchema(value, fn);
    });
  }
}

function createNewSchema() {
  return {
    name: uid(),
    type: 'void',
    'x-component': 'Grid',
    'x-initializer': 'assignFieldValuesForm:configureFields',
  };
}

export function AssignedFieldsFormSchemaConfig(props) {
  const executed = useWorkflowExecuted();
  const { setFormValueChanged } = useActionContext();
  const scope = useWorkflowVariableOptions();

  const { values, setValuesIn, disabled } = useForm();
  const params = toJS(values.params);
  const [dataSourceName, collectionName] = parseCollectionName(values.collection);

  const schemaOptions = useSchemaOptionsContext();

  const [schema, setSchema] = useState(
    props.value && Object.keys(props.value).length ? props.value : createNewSchema(),
  );

  const form = useMemo(
    () =>
      createForm({
        initialValues: params.values,
        disabled: Boolean(executed),
        effects() {
          onFormValuesChange((f) => {
            setValuesIn('params.values', toJS(f.values));
            setFormValueChanged(true);
          });
        },
      }),
    [executed],
  );

  useFormEffects(() => {
    onFieldValueChange('collection', async (field) => {
      form.clearFormGraph('*');
      const newSchema = createNewSchema();
      setValuesIn('params.values', {});
      setSchema(newSchema);
    });
  });

  const onChange = useCallback(
    (s) => {
      const [nextSchema] = Object.values(s.toJSON().properties);
      props.onChange(nextSchema);

      const keys = new Set<string>();
      reduceSchema(nextSchema, (item) => {
        if (item['x-component'] === 'AssignedField') {
          if (item['x-collection-field']?.startsWith(`${collectionName}.`)) {
            const [, field] = item['x-collection-field'].split('.');
            keys.add(field);
          }
        }
      });
      const nextValues = {};
      Array.from(keys).forEach((key) => {
        if (key in form.values) {
          nextValues[key] = form.values[key];
        }
      });
      setValuesIn('params.values', nextValues);
    },
    [collectionName, form.values, props, setValuesIn],
  );

  return (
    <Card>
      <CollectionManagerProvider dataSource={dataSourceName}>
        <CollectionProvider name={collectionName}>
          <RerenderDataBlockProvider>
            <FormProvider form={form}>
              <FormLayout layout={'vertical'}>
                <VariableScopeProvider scope={scope}>
                  <SchemaComponentProvider form={form} designable={!disabled}>
                    <SchemaComponentOptions {...schemaOptions}>
                      <SchemaComponent schema={schema} onChange={onChange} />
                    </SchemaComponentOptions>
                  </SchemaComponentProvider>
                </VariableScopeProvider>
              </FormLayout>
            </FormProvider>
          </RerenderDataBlockProvider>
        </CollectionProvider>
      </CollectionManagerProvider>
    </Card>
  );
}
