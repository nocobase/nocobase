/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { ComponentType, lazy } from 'react';
import { get } from 'lodash';
import { useImported } from 'react-imported-component';

export function createLazyComponents<M extends ComponentType<any>>(
  factory: () => Promise<{ default: M }>,
): React.LazyExoticComponent<M>;

export function createLazyComponents<M extends Record<string, any>, K extends keyof M & string>(
  factory: () => Promise<M>,
  ...componentNames: K[]
): Record<K, React.LazyExoticComponent<M[K]>>;

export function createLazyComponents<M extends Record<string, any>, K extends keyof M & string>(
  factory: () => Promise<M>,
  ...componentNames: K[]
) {
  if (componentNames.length === 0) {
    const LazyComponent = lazy(() =>
      factory().then((module) => ({
        default: module.default,
      })),
    );
    return (props) => (
      <React.Suspense fallback={<div>Loading...</div>}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  }

  return componentNames.reduce(
    (acc, name) => {
      const LazyComponent = lazy(() =>
        factory().then((module) => ({
          default: get(module, name),
        })),
      );
      acc[name] = (props) => (
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent {...props} />
        </React.Suspense>
      );
      return acc;
    },
    {} as Record<K, React.ComponentType<any>>,
  );
}

export function useLazyHook<T = () => any>(importor: Parameters<typeof useImported>[0], name: string) {
  const { imported, loading, loadable } = useImported(importor, (module) => module[name]);
  if (loading) {
    throw loadable.resolution;
  }
  return imported as T;
}

export const LazyComponentLoader = ({ $_import, $_pickers, ...props }) => {
  const { imported, loading } = useImported($_import, $_pickers);
  if (loading || !imported) {
    return null; // TODO: add loading component here
  }
  const Component = imported as ComponentType<any>;
  return <Component {...props} />;
};
