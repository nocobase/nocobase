/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import { isValidElement, useContext } from 'react';

interface Props {
  /**
   * 不使用缓存
   */
  noCache?: boolean;
}

const compileCache = {};

const hasVariable = (source: string) => {
  const reg = /{{.*?}}/g;
  return reg.test(source);
};

export const useCompile = ({ noCache }: Props = { noCache: false }) => {
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
      try {
        cacheKey = JSON.stringify(source);
      } catch (e) {
        console.warn('Failed to stringify:', e);
        return source;
      }
      if (compileCache[cacheKey]) return compileCache[cacheKey];
      shouldCompile = hasVariable(cacheKey);
    }

    // source is Array, for example: [{ 'title': "{{ ('Admin')}}", name: 'admin' }, { 'title': "{{ ('Root')}}", name: 'root' }]
    if (Array.isArray(source)) {
      try {
        cacheKey = JSON.stringify(source);
      } catch (e) {
        console.warn('Failed to stringify:', e);
        return source;
      }
      if (compileCache[cacheKey]) return compileCache[cacheKey];
      shouldCompile = hasVariable(cacheKey);
    }

    if (shouldCompile) {
      const mergedScope = { ...options?.scope, ...scope, ...ext };
      if (!cacheKey) {
        return Schema.compile(source, mergedScope);
      }
      try {
        if (noCache) {
          return Schema.compile(source, mergedScope);
        }
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
