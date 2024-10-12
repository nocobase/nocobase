/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
    const ops = getInterface(field?.interface)?.filterable?.operators || [];
    return ops.filter((o) => typeof o.visible !== 'function' || o.visible(field));
  }, [schema.name]);
  return res;
};
