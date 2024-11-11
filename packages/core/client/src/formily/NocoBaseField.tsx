/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FieldContext, IFieldProps, JSXComponent, Schema, useField, useForm } from '@formily/react';
import React, { useMemo } from 'react';
import { useCompile } from '../schema-component/hooks/useCompile';
import { NocoBaseReactiveField } from './NocoBaseReactiveField';
import { createNocoBaseField } from './createNocoBaseField';

export const NocoBaseField = <D extends JSXComponent, C extends JSXComponent>(
  props: IFieldProps<D, C> & { schema: Schema },
) => {
  const compile = useCompile();
  const form = useForm();
  const parent = useField();
  const field = useMemo(
    () => createNocoBaseField.call(form, { basePath: parent?.address, compile, ...props }),
    [form, parent?.address, props],
  );

  return (
    <FieldContext.Provider value={field}>
      <NocoBaseReactiveField field={field}>{props.children}</NocoBaseReactiveField>
    </FieldContext.Provider>
  );
};
