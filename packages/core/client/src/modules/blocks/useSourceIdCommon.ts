import { InheritanceCollectionMixin } from '../../collection-manager/mixins/InheritanceCollectionMixin';
import { useCollectionRecordData } from '../../data-source/collection-record/CollectionRecordProvider';
import { useCollectionManager } from '../../data-source/collection/CollectionManagerProvider';

/**
 * @internal
 * 大部分区块（除了详情和编辑表单）都适用的获取 sourceId 的 hook
 * @param association
 * @returns
 */
export const useSourceIdCommon = (association: string) => {
  const recordData = useCollectionRecordData();
  const cm = useCollectionManager();

  if (!association) return;

  const associationField = cm.getCollectionField(association);
  const associationCollection = cm.getCollection<InheritanceCollectionMixin>(associationField.collectionName);

  return recordData?.[
    associationField.sourceKey || associationCollection.filterTargetKey || associationCollection.getPrimaryKey() || 'id'
  ];
};
