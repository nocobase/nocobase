/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useExpressionScope } from '@formily/react';
import _ from 'lodash';
import React, { ComponentType, Suspense, useMemo } from 'react';
import { useDesignable } from '../schema-component';
import { Spin } from 'antd';

const useDefaultDynamicComponentProps = () => undefined;

const getHook = (str: string, scope: Record<string, any>, allText: string) => {
  let res = undefined;
  if (_.isFunction(str)) {
    res = str;
  } else {
    res = scope[str];
    if (!res) {
      console.error(`${allText} is not registered`);
    }
  }
  return res || useDefaultDynamicComponentProps;
};

const getUseDynamicProps = (useComponentPropsStr: string, scope: Record<string, any>) => {
  if (!useComponentPropsStr) {
    return useDefaultDynamicComponentProps;
  }

  if (_.isFunction(useComponentPropsStr)) {
    return useComponentPropsStr;
  }

  const pathList = useComponentPropsStr.split('.');
  let result;

  for (const item of pathList) {
    result = getHook(item, result || scope, useComponentPropsStr);
  }

  return result;
};

export function useDynamicComponentProps(useComponentPropsStr?: string, props?: any) {
  const scope = useExpressionScope();
  const res = getUseDynamicProps(useComponentPropsStr, scope)(props);

  return res;
}

interface WithSchemaHookOptions {
  displayName?: string;
}

export function withDynamicSchemaProps<T = any>(
  Component: React.ComponentType<T>,
  options: WithSchemaHookOptions = {},
) {
  const displayName = options.displayName || Component.displayName || Component.name;
  const ComponentWithProps: ComponentType<T> = (props) => {
    const { dn, findComponent } = useDesignable();
    const useComponentPropsStr = useMemo(() => {
      const xComponent = dn.getSchemaAttribute('x-component');
      const xDecorator = dn.getSchemaAttribute('x-decorator');
      const xUseComponentProps = dn.getSchemaAttribute('x-use-component-props');
      const xUseDecoratorProps = dn.getSchemaAttribute('x-use-decorator-props');

      if (xComponent && xUseComponentProps && findComponent(xComponent) === ComponentWithProps) {
        return xUseComponentProps;
      }

      if (xDecorator && xUseDecoratorProps && findComponent(xDecorator) === ComponentWithProps) {
        return xUseDecoratorProps;
      }
    }, [dn]);
    const schemaProps = useDynamicComponentProps(useComponentPropsStr, props);

    const memoProps = useMemo(() => {
      return { ...props, ...schemaProps };
    }, [schemaProps, props]);

    return (
      <Suspense fallback={<Spin />}>
        <Component {...memoProps}>{props.children}</Component>
      </Suspense>
    );
  };

  Component.displayName = displayName;
  ComponentWithProps.displayName = `withSchemaProps(${displayName})`;

  return ComponentWithProps;
}
