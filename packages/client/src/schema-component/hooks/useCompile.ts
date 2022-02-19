import { compile } from '@formily/json-schema/lib/compiler';
import { SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import { useContext } from 'react';

export const useCompile = () => {
  const options = useContext(SchemaOptionsContext);
  const scope = useContext(SchemaExpressionScopeContext);
  return (source: any) => {
    return compile(source, { ...options.scope, ...scope });
  };
};
