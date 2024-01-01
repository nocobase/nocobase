import {
  CollectionManagerProviderV2,
  CollectionManagerV2,
  useApp,
  useCollectionManagerV2,
  useHistoryCollectionsByNames,
} from '@nocobase/client';
import React, { useMemo } from 'react';

export const SnapshotHistoryCollectionProvider: React.FC<{ collectionName: string }> = (props) => {
  const { collectionName } = props;
  const cm = useCollectionManagerV2();

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

  const app = useApp();

  const newCollectionManager = useMemo(() => {
    const options = cm.clone();
    // 过滤出不需要替换的表
    const filterdAllCollection = options.collections.filter(
      (c) => !finallyHistoryCollecionts.map((i) => i.name).includes(c.name),
    );
    const overridedCollections = [...filterdAllCollection, ...finallyHistoryCollecionts];

    const newCM = new CollectionManagerV2(
      {
        ...options,
        collections: overridedCollections,
      },
      app,
    );
    newCM.setCollections(cm.getCollections());
    return newCM;
  }, [cm, finallyHistoryCollecionts, app]);

  // 最终替换后的表

  return (
    <CollectionManagerProviderV2 collectionManager={newCollectionManager}>{props.children}</CollectionManagerProviderV2>
  );
};
