import { useFieldSchema } from '@formily/react';
import { useCollection, useCollectionManager } from '../../../../collection-manager';

/**
 * 获取字段相关的配置信息
 * @returns
 */
export function useCollectionField() {
  const { getCollectionJoinField } = useCollectionManager();
  const { getField } = useCollection();
  const fieldSchema = useFieldSchema();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  return collectionField;
}
