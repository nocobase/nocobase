import {
  CollectionManagerProvider_deprecated,
  ExtendCollectionsProvider,
  useCollectionManager_deprecated,
  useHistoryCollectionsByNames,
} from '@nocobase/client';
import React from 'react';

export const SnapshotHistoryCollectionProvider: React.FC<{ collectionName: string }> = (props) => {
  const { collectionName } = props;
  const { collections: allCollections } = useCollectionManager_deprecated();

  // 目标表
  const snapshotTargetCollection = useHistoryCollectionsByNames([collectionName])?.[0];
  // 目标如果是继承表则获取继承表
  const inheritCollections = useHistoryCollectionsByNames(snapshotTargetCollection?.inherits ?? []);
  // 目标表内关联字段的表
  const associationFieldTargetCollections = useHistoryCollectionsByNames(
    snapshotTargetCollection?.fields.filter((i) => i.interface !== 'snapshot').map((i) => i.target) ?? [],
  );

  // 替换表的集合
  const finallyHistoryCollecionts = [
    snapshotTargetCollection,
    ...associationFieldTargetCollections,
    ...inheritCollections,
  ].filter((i) => i);

  // 过滤出不需要替换的表
  const filterdAllCollection = allCollections.filter(
    (c) => !finallyHistoryCollecionts.map((i) => i.name).includes(c.name),
  );

  // 最终替换后的表
  const overridedCollections = [...filterdAllCollection, ...finallyHistoryCollecionts];

  return (
    <ExtendCollectionsProvider collections={overridedCollections}>
      <CollectionManagerProvider_deprecated>{props.children}</CollectionManagerProvider_deprecated>
    </ExtendCollectionsProvider>
  );
};
