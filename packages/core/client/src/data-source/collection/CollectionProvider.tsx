/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { CollectionFieldContext } from '../collection-field/CollectionFieldProvider';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';
import type { Collection, CollectionOptions, GetCollectionFieldPredicate } from './Collection';
import { useCollectionManager } from './CollectionManagerProvider';

export const CollectionContext = createContext<Collection>(null);
CollectionContext.displayName = 'CollectionContext';

export interface CollectionProviderProps {
  name: string | CollectionOptions;
  children?: ReactNode;
  allowNull?: boolean;
}

export const CollectionProvider: FC<CollectionProviderProps> = (props) => {
  const { name, children, allowNull } = props;
  const collectionManager = useCollectionManager();
  const collection = useMemo(() => collectionManager?.getCollection(name), [collectionManager, name]);
  if (!collection && allowNull) return <>{props.children}</>;
  if (!collection && !allowNull) return <CollectionDeletedPlaceholder type="Collection" name={name as string} />;
  return <CollectionContext.Provider value={collection}>{children}</CollectionContext.Provider>;
};

/**
 * 用来消除普通区块（非关系区块）中可能存在的 CollectionField 上下文，因为普通区块就是一个区块，不应该和任何字段有关联
 * @param props
 * @returns
 */
export const SanitizedCollectionProvider: FC<CollectionProviderProps> = (props) => {
  return (
    <CollectionFieldContext.Provider value={null}>
      <CollectionProvider {...props} />
    </CollectionFieldContext.Provider>
  );
};

export function useCollection<Mixins = {}>(): (Mixins & Collection) | undefined {
  const context = useContext(CollectionContext);

  return context as (Mixins & Collection) | undefined;
}

export const useCollectionFields = (predicate?: GetCollectionFieldPredicate) => {
  const collection = useCollection();
  const fields = useMemo(() => collection.getFields(predicate), [collection, predicate]);
  return fields;
};
