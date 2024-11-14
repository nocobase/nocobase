/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { ComponentType, lazy } from 'react';
import { get } from 'lodash-es';
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
    return lazy(() =>
      factory().then((module) => ({
        default: module.default,
      })),
    );
  }

  return componentNames.reduce(
    (acc, name) => {
      acc[name] = lazy(() =>
        factory().then((module) => ({
          default: get(module, name),
        })),
      );
      return acc;
    },
    {} as Record<K, React.LazyExoticComponent<M[K]>>,
  );
}

export const LazyComponentLoader = ({ $_import, $_pickers, ...props }) => {
  const { imported, loading } = useImported($_import, $_pickers);
  if (loading || !imported) {
    return null; // TODO: add loading component here
  }
  const Component = imported as ComponentType<any>;
  return <Component {...props} />;
};
