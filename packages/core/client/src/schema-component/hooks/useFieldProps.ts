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
