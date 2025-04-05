/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm, onFieldValueChange } from '@formily/core';
import { FieldContext, FormContext } from '@formily/react';
import { merge } from '@formily/shared';
import React, { useCallback, useContext, useMemo } from 'react';
import { CollectionFieldOptions_deprecated } from '../../../collection-manager';
import { SchemaComponent } from '../../core';
import { FilterContext } from './context';
import { VariableInput, getShouldChange } from '../../../schema-settings/VariableInput/VariableInput';
import { useCollectionRecordData } from '../../../data-source';
import { useLocalVariables, useVariables } from '../../../variables';
import { useCollectionManager_deprecated } from '../../../collection-manager';

export interface DynamicComponentProps {
  value: any;
  /**
   * `Filter` 组件左侧选择的字段
   */
  collectionField: CollectionFieldOptions_deprecated;
  onChange: (value: any) => void;
  renderSchemaComponent: () => React.JSX.Element;
}

interface Props {
  value: any;
  collectionField?: CollectionFieldOptions_deprecated;
  onChange: (value: any) => void;
  style?: React.CSSProperties;
  componentProps?: any;
  schema?: any;
  setScopes?: any;
}

export const DynamicComponent = (props: Props) => {
  const { setScopes } = props;
  const { disabled } = useContext(FilterContext) || {};
  const record = useCollectionRecordData();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const { getAllCollectionsInheritChain } = useCollectionManager_deprecated();
  const { collectionField } = props;
  const component = useCallback((props: DynamicComponentProps) => {
    return (
      <VariableInput
        {...props}
        form={form}
        record={record}
        setScopes={setScopes}
        shouldChange={getShouldChange({
          collectionField,
          variables,
          localVariables,
          getAllCollectionsInheritChain,
        })}
      />
    );
  }, []);
  const form = useMemo(() => {
    return createForm({
      values: {
        value: props.value,
      },
      effects() {
        onFieldValueChange('value', (field) => {
          props?.onChange?.(field.value);
        });
      },
      disabled,
    });
  }, [JSON.stringify(props.value), props.schema]);
  const renderSchemaComponent: any = useCallback(() => {
    const componentProps = merge(props?.schema?.['x-component-props'] || {}, props.componentProps || {});

    return (
      <FieldContext.Provider value={null}>
        <SchemaComponent
          schema={{
            'x-component': 'Input',
            ...props.schema,
            'x-component-props': merge(componentProps, {
              style: {
                minWidth: 150,
                ...props.style,
              },
              utc: false,
            }),
            name: 'value',
            'x-read-pretty': false,
            'x-validator': undefined,
            'x-decorator': undefined,
          }}
        />
      </FieldContext.Provider>
    );
  }, [props.schema]);
  return (
    <FormContext.Provider value={form}>
      {React.createElement<DynamicComponentProps>(component, {
        value: props.value,
        collectionField: props.collectionField,
        onChange: props?.onChange,
        renderSchemaComponent,
      })}
    </FormContext.Provider>
  );
};

export const FilterDynamicComponent = DynamicComponent;
