import { useFieldSchema } from '@formily/react';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { useMemo } from 'react';

/**
 * 获取当前字段所支持的操作符列表
 * @returns
 */
export const useOperatorList = (): any[] => {
  const schema = useFieldSchema();
  const { name } = useCollection_deprecated();
  const { getCollectionFields, getInterface } = useCollectionManager_deprecated();

  const res = useMemo(() => {
    const fieldInterface = schema['x-designer-props']?.interface;
    const collectionFields = getCollectionFields(name);
    if (fieldInterface) {
      return getInterface(fieldInterface)?.filterable?.operators || [];
    }
    const field = collectionFields.find((item) => item.name === schema.name);
    return getInterface(field?.interface)?.filterable?.operators || [];
  }, [schema.name]);
  return res;
};
