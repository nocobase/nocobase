import { InheritanceCollectionMixin } from '../../collection-manager/mixins/InheritanceCollectionMixin';
import { useCollectionManager } from '../../data-source/collection/CollectionManagerProvider';

/**
 * 用于获取关系字段的 source collection 的 key
 * @param association string
 * @returns
 */
export const useSourceKey = (association: string) => {
  const cm = useCollectionManager();

  if (!association) return;

  const associationField = cm.getCollectionField(association);

  if (!associationField) {
    return;
  }

  const sourceCollection = cm.getCollection<InheritanceCollectionMixin>(association.split('.')[0]);

  // 1. hasOne 和 hasMany 和 belongsToMany 的字段存在 sourceKey，所以会直接返回 sourceKey；
  // 2. belongsTo 不存在 sourceKey，所以会使用 filterTargetKey；
  // 3. 后面的主键和 id 是为了保险起见加上的；
  return associationField.sourceKey || sourceCollection.filterTargetKey || sourceCollection.getPrimaryKey() || 'id';
};
