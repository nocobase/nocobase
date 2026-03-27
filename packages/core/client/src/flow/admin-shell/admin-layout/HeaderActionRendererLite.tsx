/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaOptionsContext } from '@formily/react';
import get from 'lodash/get';
import React, { useContext, useEffect, useState } from 'react';
import { isValidElementType } from 'react-is';
import { useApp } from '@nocobase/client-v2/flow-compat';

type ComponentTypeAndString = React.ComponentType<any> | string;
type ComponentLoaderResult =
  | ComponentTypeAndString
  | {
      default?: ComponentTypeAndString;
      Component?: ComponentTypeAndString;
    };

export type HeaderActionItemLite = {
  name: string;
  componentLoader: () => Promise<ComponentLoaderResult>;
  order?: number;
  pin?: boolean;
  snippet?: string;
};

/**
 * 将 loader 结果归一化为可渲染组件。
 */
export function resolveLoadedHeaderActionComponent(
  moduleOrComponent: ComponentLoaderResult,
): ComponentTypeAndString | undefined {
  if (!moduleOrComponent) {
    return undefined;
  }

  if (typeof moduleOrComponent === 'function' || typeof moduleOrComponent === 'string') {
    return moduleOrComponent;
  }

  return moduleOrComponent.default || moduleOrComponent.Component;
}

function isRenderableHeaderActionComponent(component: unknown): component is ComponentTypeAndString {
  return isValidElementType(component);
}

/**
 * 渲染单个头部动作。
 */
export function HeaderActionRendererLite(props: { item: HeaderActionItemLite }) {
  const app = useApp();
  const schemaOptions = useContext(SchemaOptionsContext) || {};
  const components = schemaOptions.components;
  const { componentLoader } = props.item;
  const [loadedComponent, setLoadedComponent] = useState<ComponentTypeAndString | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let canceled = false;

    setLoadedComponent(null);
    setHasError(false);

    componentLoader()
      .then((moduleOrComponent) => {
        const nextComponent = resolveLoadedHeaderActionComponent(moduleOrComponent);
        if (!isRenderableHeaderActionComponent(nextComponent)) {
          throw new Error('header action componentLoader must resolve to a valid React component or component module.');
        }

        if (!canceled) {
          setLoadedComponent(nextComponent);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!canceled) {
          setHasError(true);
        }
      });

    return () => {
      canceled = true;
    };
  }, [componentLoader]);

  if (!loadedComponent || hasError) {
    return null;
  }

  if (typeof loadedComponent === 'string') {
    const schemaComponent = get(components, loadedComponent) as ComponentTypeAndString | undefined;
    if (schemaComponent) {
      if (!isRenderableHeaderActionComponent(schemaComponent)) {
        console.error(`Header action component ${loadedComponent} is not a valid React component`);
        return null;
      }
      return React.createElement(schemaComponent as any);
    }

    const appComponent = app.getComponent?.(loadedComponent, false);
    if (!isRenderableHeaderActionComponent(appComponent)) {
      console.error(`Header action component ${loadedComponent} not found`);
      return null;
    }
    return <>{app.renderComponent(appComponent)}</>;
  }

  if (!isRenderableHeaderActionComponent(loadedComponent)) {
    console.error('Header action componentLoader resolved to an invalid React component');
    return null;
  }

  return React.createElement(loadedComponent as any);
}
