/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, ReactNode, createContext, useContext, useEffect, useMemo } from 'react';
import type { CollectionManager } from './CollectionManager';
import type { Collection } from './Collection';
import { DataSourceProvider, useDataSource } from '../data-source/DataSourceProvider';
import { useExtendCollections } from './ExtendCollectionsProvider';

export const CollectionManagerContext = createContext<CollectionManager>(null);
CollectionManagerContext.displayName = 'CollectionManagerContext';

export interface CollectionManagerProviderProps {
  instance?: CollectionManager;
  dataSource?: string;
  children?: ReactNode;
}

const CollectionManagerProviderInner: FC<CollectionManagerProviderProps> = ({ instance, children }) => {
  const dataSource = useDataSource();
  const extendCollections = useExtendCollections();
  const collectionManager = useMemo(() => instance || dataSource?.collectionManager, [instance, dataSource]);
  const [random, setRandom] = React.useState(Math.random());
  useEffect(() => {
    collectionManager.dataSource.addReloadCallback(() => {
      setRandom(Math.random());
    });
  }, [collectionManager]);

  const cm = useMemo(() => {
    const res = collectionManager;
    if (extendCollections?.length) {
      return res.clone(extendCollections);
    }
    return res;
    // Random is used to force re-render when collectionManager is changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionManager, extendCollections, random]);
  return <CollectionManagerContext.Provider value={cm}>{children}</CollectionManagerContext.Provider>;
};

export const CollectionManagerProvider: FC<CollectionManagerProviderProps> = ({ instance, dataSource, children }) => {
  return (
    <DataSourceProvider dataSource={dataSource}>
      <CollectionManagerProviderInner instance={instance}>{children}</CollectionManagerProviderInner>
    </DataSourceProvider>
  );
};

export function useCollectionManager() {
  const context = useContext<CollectionManager>(CollectionManagerContext);
  return context;
}

export const useCollections = (predicate?: (collection: Collection) => boolean) => {
  const collectionManager = useCollectionManager();
  const collections = useMemo(() => collectionManager.getCollections(predicate), [collectionManager, predicate]);
  return collections;
};
