/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useContext, useRef } from 'react';
import { Schema, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';

export const useFieldProps = (schema: Schema) => {
  const options = useContext(SchemaOptionsContext);
  const scope = useContext(SchemaExpressionScopeContext);
  const scopeRef = useRef<any>();
  scopeRef.current = scope;
  return schema.toFieldProps({
    ...options,
    get scope() {
      return {
        ...options.scope,
        ...scopeRef.current,
      };
    },
  }) as any;
};
