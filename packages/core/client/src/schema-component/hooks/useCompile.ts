import { Schema, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import { useContext, isValidElement } from 'react';

const compileCache = {};

export const useCompile = () => {
  const options = useContext(SchemaOptionsContext);
  const scope = useContext(SchemaExpressionScopeContext);
  return (source: any, ext?: any) => {
    let shouldCompile = false;
    let cacheKey: string;

    // source is i18n, for example: {{ t('Add new') }}
    if (typeof source === 'string' && source.startsWith('{{')) {
      shouldCompile = true;
      cacheKey = source;
    }

    // source is Component Object, for example: { 'x-component': "Cascader", type: "array", title: "所属地区(行政区划)" }
    if (source && typeof source === 'object' && !isValidElement(source)) {
      shouldCompile = true;
      cacheKey = JSON.stringify(source);
    }

    // source is Array, for example: [{ 'title': "{{ ('Admin')}}", name: 'admin' }, { 'title': "{{ ('Root')}}", name: 'root' }]
    if (Array.isArray(source)) {
      shouldCompile = true;
    }

    if (shouldCompile) {
      const mergedScope = { ...options.scope, ...scope, ...ext };
      if (!cacheKey) {
        return Schema.compile(source, mergedScope);
      }
      try {
        compileCache[cacheKey] = compileCache[cacheKey] || Schema.compile(source, mergedScope);
        return compileCache[cacheKey];
      } catch (e) {
        console.log('useCompile error', source, e);
        return Schema.compile(source, mergedScope);
      }
    }

    // source is: plain object、string、number、boolean、undefined、null
    return source;
  };
};
