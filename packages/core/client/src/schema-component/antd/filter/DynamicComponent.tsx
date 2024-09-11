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
import { useComponent } from '../../hooks';
import { FilterContext } from './context';

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
  schema: any;
  value: any;
  collectionField: CollectionFieldOptions_deprecated;
  onChange: (value: any) => void;
  style?: React.CSSProperties;
  componentProps?: any;
}

export const DynamicComponent = (props: Props) => {
  const { dynamicComponent, disabled } = useContext(FilterContext);
  const component = useComponent(dynamicComponent);
  const form = useMemo(() => {
    return createForm({
      values: {
        value: props.value,
      },
      disabled,
      effects() {
        onFieldValueChange('value', (field) => {
          props?.onChange?.(field.value);
        });
      },
    });
  }, [JSON.stringify(props.value), props.schema]);
  const renderSchemaComponent = useCallback(() => {
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
            'x-disabled': disabled,
          }}
        />
      </FieldContext.Provider>
    );
  }, [props.schema, disabled]);
  return (
    <FormContext.Provider value={form}>
      {component
        ? React.createElement<DynamicComponentProps>(component, {
            value: props.value,
            collectionField: props.collectionField,
            onChange: props?.onChange,
            renderSchemaComponent,
          })
        : renderSchemaComponent()}
    </FormContext.Provider>
  );
};

export const FilterDynamicComponent = DynamicComponent;
