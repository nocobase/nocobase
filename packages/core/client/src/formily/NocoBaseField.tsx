/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FieldContext, IFieldProps, JSXComponent, Schema } from '@formily/react';
import React, { useMemo } from 'react';
import { useCompile } from '../schema-component/hooks/useCompile';
import { NocoBaseReactiveField } from './NocoBaseReactiveField';
import { createNocoBaseField } from './createNocoBaseField';

/**
 * To maintain high performance of Table, this component removes Formily-related components
 * @param props component props
 * @returns
 */
export const NocoBaseField = <D extends JSXComponent, C extends JSXComponent>(
  props: IFieldProps<D, C> & { schema: Schema },
) => {
  const compile = useCompile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const field = useMemo(() => createNocoBaseField({ ...props, compile }), []);

  return (
    <FieldContext.Provider value={field as any}>
      <NocoBaseReactiveField field={field as any}>{props.children}</NocoBaseReactiveField>
    </FieldContext.Provider>
  );
};
