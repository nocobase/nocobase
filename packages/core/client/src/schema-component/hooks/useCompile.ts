import { Schema, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import { useContext } from 'react';

const i18nMap = {};
const componentMap = {};

export const useCompile = () => {
  const options = useContext(SchemaOptionsContext);
  const scope = useContext(SchemaExpressionScopeContext);
  return (source: any, ext?: any) => {
    // source is i18n, for example: {{ t('Add new') }}
    if (typeof source === 'string' && source.startsWith('{{')) {
      i18nMap[source] = i18nMap[source] || Schema.compile(source, { ...options.scope, ...scope, ...ext });
      return i18nMap[source];
    }
    // source is ReactNode
    if (source && typeof source === 'object') {
      try {
        componentMap[JSON.stringify(source)] =
          componentMap[JSON.stringify(source)] || Schema.compile(source, { ...options.scope, ...scope, ...ext });
        return componentMap[JSON.stringify(source)];
      } catch (e) {
        console.log('useCompile error', e);
        return Schema.compile(source, { ...options.scope, ...scope, ...ext });
      }
    }
    return source;
  };
};
