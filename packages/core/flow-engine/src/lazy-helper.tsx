/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { lazy as reactLazy } from 'react';

type LazyComponentType<M extends Record<string, any>, K extends keyof M> = {
  [P in K]: M[P];
};

export function lazy<M extends Record<'default', any>>(factory: () => Promise<M>): M['default'];

export function lazy<M extends Record<string, any>, K extends keyof M = keyof M>(
  factory: () => Promise<M>,
  ...componentNames: K[]
): LazyComponentType<M, K>;

export function lazy<M extends Record<string, any>, K extends keyof M>(
  factory: () => Promise<M>,
  ...componentNames: K[]
) {
  if (componentNames.length === 0) {
    const LazyComponent = reactLazy(() =>
      factory().then((module) => ({
        default: module.default,
      })),
    );
    const Component = (props) => (
      <React.Suspense fallback={null}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
    return Component;
  }

  return componentNames.reduce(
    (acc, name) => {
      const LazyComponent = reactLazy(() =>
        factory().then((module) => ({
          default: module[name],
        })),
      );
      acc[name] = ((props) => (
        <React.Suspense fallback={null}>
          <LazyComponent {...props} />
        </React.Suspense>
      )) as M[K];
      return acc;
    },
    {} as LazyComponentType<M, K>,
  );
}
