import { useCollectionRecordData } from '../../data-source/collection-record/CollectionRecordProvider';
import { useSourceKey } from './useSourceKey';

/**
 * @internal
 * 大部分区块（除了详情和编辑表单）都适用的获取 sourceId 的 hook
 * @param association
 * @returns
 */
export const useSourceIdCommon = (association: string) => {
  const recordData = useCollectionRecordData();
  const sourceKey = useSourceKey(association);

  if (!association) return;

  return recordData?.[sourceKey];
};
