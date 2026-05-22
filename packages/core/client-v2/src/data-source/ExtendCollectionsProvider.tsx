/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionOptions } from '@nocobase/flow-engine';
import React, { FC, ReactNode, useEffect, useRef } from 'react';
import { useApp } from '../hooks';

export interface ExtendCollectionsProviderProps {
  /** Data source key to extend. Defaults to `'main'`. */
  dataSource?: string;
  /** Collections to surface for the lifetime of this provider's subtree. */
  collections: CollectionOptions[];
  children?: ReactNode;
}

/**
 * Mount-scoped collection injector. Adds the given `collections` to the target data source on mount and removes them on unmount. Survives mid-session reloads via `dataSource:loaded` events.
 *
 * Use this for client-only collections — e.g. a `schema-only` server collection that isn't auto-published to the v2 data source, or a pure UI-side mirror — so downstream components (like `<CollectionFilter>`) can resolve the collection by name.
 */
export const ExtendCollectionsProvider: FC<ExtendCollectionsProviderProps> = ({
  dataSource = 'main',
  collections,
  children,
}) => {
  const app = useApp();
  const ownedRef = useRef<Set<string>>(new Set());

  const apply = () => {
    const ds = app.dataSourceManager?.getDataSource?.(dataSource);
    if (!ds) return;
    for (const collection of collections) {
      if (ds.getCollection?.(collection.name)) continue;
      ds.addCollection?.(collection);
      ownedRef.current.add(collection.name);
    }
  };

  apply();

  useEffect(() => {
    const onLoaded = (event: Event) => {
      const key = (event as CustomEvent<{ dataSourceKey: string }>).detail?.dataSourceKey;
      if (key === dataSource || key === '*') apply();
    };
    app.eventBus?.addEventListener('dataSource:loaded', onLoaded);

    return () => {
      app.eventBus?.removeEventListener('dataSource:loaded', onLoaded);
      const ds = app.dataSourceManager?.getDataSource?.(dataSource);
      const owned = ownedRef.current;
      ownedRef.current = new Set();
      if (!ds) return;
      for (const name of owned) {
        ds.removeCollection?.(name);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, dataSource, collections]);

  return <>{children}</>;
};

export default ExtendCollectionsProvider;
