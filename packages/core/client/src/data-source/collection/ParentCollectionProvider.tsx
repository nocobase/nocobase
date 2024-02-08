import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';
import type { CollectionOptionsV2, CollectionV2 } from './Collection';
import { useCollectionManagerV2 } from './CollectionManagerProvider';

export const ParentCollectionContextV2 = createContext<CollectionV2>(null);
ParentCollectionContextV2.displayName = 'ParentCollectionContextV2';

export interface ParentCollectionProviderPropsV2 {
  name: string | CollectionOptionsV2;
  children?: ReactNode;
  allowNull?: boolean;
}

/**
 * 用于提供关于 `关系区块` 和 `关系字段` 的上级 collection
 * @param props
 * @returns
 */
export const ParentCollectionProviderV2: FC<ParentCollectionProviderPropsV2> = (props) => {
  const { name, children, allowNull } = props;
  const collectionManager = useCollectionManagerV2();
  const collection = useMemo(() => collectionManager?.getCollection(name), [collectionManager, name]);
  if (!collection && allowNull) return <>{props.children}</>;
  if (!collection && !allowNull) return <CollectionDeletedPlaceholder type="Collection" name={name as string} />;
  return <ParentCollectionContextV2.Provider value={collection}>{children}</ParentCollectionContextV2.Provider>;
};

export function useParentCollectionV2<Mixins = {}>(): (Mixins & CollectionV2) | undefined {
  const context = useContext(ParentCollectionContextV2);

  return context as (Mixins & CollectionV2) | undefined;
}
