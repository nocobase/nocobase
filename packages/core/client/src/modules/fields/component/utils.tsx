import { useFieldSchema } from '@formily/react';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';

/**
 * 获取字段相关的配置信息
 * @returns
 */
export function useCollectionField() {
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const { getField } = useCollection_deprecated();
  const fieldSchema = useFieldSchema();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  return collectionField;
}
