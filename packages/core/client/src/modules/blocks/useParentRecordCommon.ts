import { useCollectionRecordData } from '../../data-source/collection-record/CollectionRecordProvider';

/**
 * @internal
 * 大部分区块（除了详情和编辑表单）都适用的获取 sourceId 的 hook
 * @param association
 * @returns
 */
export const useParentRecordCommon = (association: string) => {
  const recordData = useCollectionRecordData();

  if (!association) return;

  return recordData;
};
