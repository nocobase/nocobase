import { useCollectionManager } from '../../data-source/collection/CollectionManagerProvider';

/**
 * 用于获取关系字段的 source collection 的 key
 * @param association string
 * @returns
 */
export const useSourceKey = (association: string) => {
  const cm = useCollectionManager();
  return cm.getSourceKeyByAssociation(association);
};
