/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FieldContext, IFieldProps, JSXComponent, Schema, useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import { useCompile } from '../schema-component/hooks/useCompile';
import { NocoBaseReactiveField } from './NocoBaseReactiveField';
import { createNocoBaseField } from './createNocoBaseField';

export function resolveLightweightFieldValue(options: { value: any; schemaDefault: any; record?: any }) {
  const { value, schemaDefault, record } = options;
  if (typeof value !== 'undefined') {
    return value;
  }

  if (record?.__is_new__ !== true) {
    return value;
  }

  return schemaDefault;
}

/**
 * To maintain high performance of Table, this component removes Formily-related components
 * @param props component props
 * @returns
 */
export const NocoBaseField = <D extends JSXComponent, C extends JSXComponent>(
  props: IFieldProps<D, C> & { schema: Schema; form?: any; record?: any },
) => {
  const compile = useCompile();
  const fieldSchema = useFieldSchema();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const field = useMemo(() => createNocoBaseField({ ...props, compile }), []);

  // update componentProps to rerender field component
  Object.assign(field.componentProps, fieldSchema['x-component-props']);
  field.form = props.form ?? field.form;

  const schemaDefault = compile(fieldSchema?.default) ?? compile(props.schema?.default);
  field.value = resolveLightweightFieldValue({ value: props.value, schemaDefault, record: props.record });

  return (
    <FieldContext.Provider value={field as any}>
      <NocoBaseReactiveField field={field as any}>{props.children}</NocoBaseReactiveField>
    </FieldContext.Provider>
  );
};
