/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { lazy as ReactLazy } from 'react';
import { Spin } from 'antd';
import { get } from 'lodash';
import { useImported, loadableResource } from 'react-imported-component';

export const LAZY_COMPONENT_KEY = Symbol('LAZY_COMPONENT_KEY');

type LazyComponentType<M extends Record<string, any>, K extends keyof M> = {
  [P in K]: M[P];
};

/**
 * Lazily loads a React component or multiple components.
 *
 * This function can be used to dynamically import a React component or multiple components
 * and return them as lazy-loaded components. It uses `React.lazy` under the hood and displays
 * a loading spinner (`Spin` from `antd`) while the component is being loaded.
 *
 * @template M - The type of the module being imported.
 * @template K - The keys of the components in the module.
 *
 * @param {() => Promise<{ default: M }>} factory - A function that returns a promise resolving to the module with a default export.
 * @returns {React.LazyExoticComponent<M>} A lazy-loaded component.
 *
 * @param {() => Promise<M>} factory - A function that returns a promise resolving to the module with named exports.
 * @param {...K[]} componentNames - The names of the components to be lazy-loaded from the module.
 * @returns {Record<K, React.LazyExoticComponent<M[K]>>} An object containing the lazy-loaded components.
 */
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
    const LazyComponent = ReactLazy(() =>
      factory().then((module) => {
        const ret = module.default;
        Component[LAZY_COMPONENT_KEY] = ret;
        return {
          default: ret,
        };
      }),
    );
    const Component = (props) => (
      <React.Suspense fallback={<Spin />}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
    return Component;
  }

  return componentNames.reduce(
    (acc, name) => {
      const LazyComponent = ReactLazy(() =>
        factory().then((module) => {
          const component = get(module, name);
          acc[name][LAZY_COMPONENT_KEY] = component;
          return {
            default: component,
          };
        }),
      );
      acc[name] = ((props) => (
        <React.Suspense fallback={<Spin />}>
          <LazyComponent {...props} />
        </React.Suspense>
      )) as M[K];
      return acc;
    },
    {} as LazyComponentType<M, K>,
  );
}

/**
 * A hook to lazily load a module and return a specific export from it.
 *
 * This hook uses `useImported` to dynamically import a module and return a specific export
 * from the module. It throws a promise while the module is being loaded, which can be caught
 * by the parent error boundary to show a loading state.
 *
 * @template T - The type of the export being picked from the module.
 *
 * @param {Parameters<typeof useImported>[0]} importor - The function to import the module.
 * @param {string | ((module: any) => T)} picker - The name of the export to pick or a function to pick the export.
 * @returns {T} The picked export from the imported module.
 *
 * @throws {Promise} Throws a promise while the module is being loaded.
 */
export function useLazy<T = () => any>(
  importor: Parameters<typeof useImported>[0],
  picker: string | ((module: any) => T),
): T {
  const exportPicker = typeof picker === 'function' ? picker : (module) => module[picker];
  const loadable = loadableResource(importor);
  if (!loadable.payload) {
    throw new Promise((resolve, reject) => {
      loadable.loadIfNeeded();
      loadable.resolution.then(resolve).catch(reject);
    });
  }
  const imported = exportPicker(loadable.payload);
  return imported as T;
}
