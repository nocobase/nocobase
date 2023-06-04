import { Schema, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import { useContext } from 'react';

export const useCompile = () => {
  const options = useContext(SchemaOptionsContext);
  const scope = useContext(SchemaExpressionScopeContext);
  return (source: any, ext?: any) => {
    // source : '{{ t('Add new') }}' or ReactNode
    if ((source && typeof source === 'object') || (typeof source === 'string' && source.includes('{{'))) {
      return Schema.compile(source, { ...options.scope, ...scope, ...ext });
    }
    return source;
  };
};
