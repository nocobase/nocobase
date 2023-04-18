import { Schema, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import { useCallback, useContext } from 'react';

export const useCompile = () => {
  const options = useContext(SchemaOptionsContext);
  const scope = useContext(SchemaExpressionScopeContext);
  return useCallback(
    (source: any, ext?: any) => {
      if (!source) {
        return source;
      }
      return Schema.compile(source, { ...options.scope, ...scope, ...ext });
    },
    [options, scope],
  );
};
