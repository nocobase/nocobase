import { Schema, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import { useContext, isValidElement } from 'react';

const i18nMap = {};
const componentMap = {};

export const useCompile = () => {
  const options = useContext(SchemaOptionsContext);
  const scope = useContext(SchemaExpressionScopeContext);
  return (source: any, ext?: any) => {
    // if (!source) return source;

    // if (typeof source === 'string') {
    //   // 多语言
    //   if (source.startsWith('{{')) {
    //     i18nMap[source] = i18nMap[source] || Schema.compile(source, { ...options.scope, ...scope, ...ext });
    //     return i18nMap[source];
    //   } else {
    //     // 普通字符串
    //     return source;
    //   }
    // }

    // // 其他的都走 Schema.compile
    // return Schema.compile(source, { ...options.scope, ...scope, ...ext });

    // source is i18n, for example: {{ t('Add new') }}
    if (typeof source === 'string' && source.startsWith('{{')) {
      i18nMap[source] = i18nMap[source] || Schema.compile(source, { ...options.scope, ...scope, ...ext });
      return i18nMap[source];
    }

    // source is Component Object, for example: { 'x-component': "Cascader", type: "array", title: "所属地区(行政区划)" }
    if (source && typeof source === 'object' && !isValidElement(source)) {
      try {
        componentMap[JSON.stringify(source)] =
          componentMap[JSON.stringify(source)] || Schema.compile(source, { ...options.scope, ...scope, ...ext });
        return componentMap[JSON.stringify(source)];
      } catch (e) {
        console.log('useCompile error', source, e);
        return Schema.compile(source, { ...options.scope, ...scope, ...ext });
      }
    }

    // source is Array, for example: [{ 'title': "{{ ('Admin')}}", name: 'admin' }, { 'title': "{{ ('Root')}}", name: 'root' }]
    if (Array.isArray(source)) {
      return Schema.compile(source, { ...options.scope, ...scope, ...ext });
    }

    // source is: plain object、string、number、boolean、undefined、null
    return source;
  };
};
