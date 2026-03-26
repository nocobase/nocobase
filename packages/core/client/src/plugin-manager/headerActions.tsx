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
import type { HeaderActionItem } from '../application/HeaderActionsManager';
import type { ComponentLoaderResult, ComponentTypeAndString } from '../application/RouterManager';
import { useApp } from '../application/hooks';

/**
 * 将 `componentLoader` 的返回值归一化为可渲染组件。
 *
 * 语义与 client-v2 `RouterManager.resolveLoadedComponent` 保持一致。
 *
 * @param moduleOrComponent loader 返回值
 * @returns 归一化后的组件或组件名
 *
 * @example
 * ```ts
 * resolveLoadedHeaderActionComponent({ default: 'Inbox' });
 * ```
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

/**
 * 校验给定值是否可作为 React element type 渲染。
 *
 * @param component 待校验的组件值
 * @returns 是否为合法的 React 组件类型
 *
 * @example
 * ```ts
 * isRenderableHeaderActionComponent('Inbox');
 * ```
 */
function isRenderableHeaderActionComponent(component: unknown): component is ComponentTypeAndString {
  return isValidElementType(component);
}

type HeaderActionRendererProps = {
  item: HeaderActionItem;
};

/**
 * 渲染单个右上角扩展动作。
 *
 * 该组件负责异步加载、协议归一化、错误隔离与最终渲染。
 *
 * @param props 动作配置
 * @returns 渲染后的动作节点
 * @throws 不向外抛出异常，单项失败时记录日志并跳过
 *
 * @example
 * ```tsx
 * <HeaderActionRenderer item={item} />
 * ```
 */
export function HeaderActionRenderer(props: HeaderActionRendererProps) {
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
