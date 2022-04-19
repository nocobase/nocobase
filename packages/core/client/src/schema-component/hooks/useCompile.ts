import { Schema, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import { useContext } from 'react';

export const useCompile = () => {
  const options = useContext(SchemaOptionsContext);
  const scope = useContext(SchemaExpressionScopeContext);
  return (source: any, ext?: any) => {
    if (!source) {
      return source;
    }
    return Schema.compile(source, { ...options.scope, ...scope, ...ext });
  };
};
