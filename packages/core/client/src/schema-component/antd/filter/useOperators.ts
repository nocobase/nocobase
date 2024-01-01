import { useFieldSchema } from '@formily/react';
import { useCollectionManagerV2, useCollectionV2 } from '../../../application';

/**
 * 获取当前字段所支持的操作符列表
 * @returns
 */
export const useOperatorList = (): any[] => {
  const schema = useFieldSchema();
  const fieldInterface = schema['x-designer-props']?.interface;
  const collection = useCollectionV2();
  const cm = useCollectionManagerV2();
  const collectionFields = collection?.getFields() || [];
  if (fieldInterface) {
    return cm?.getCollectionFieldInterface(fieldInterface)?.filterable?.operators || [];
  }

  const field = collectionFields.find((item) => item.name === schema.name);
  return cm?.getCollectionFieldInterface(field?.interface)?.filterable?.operators || [];
};
