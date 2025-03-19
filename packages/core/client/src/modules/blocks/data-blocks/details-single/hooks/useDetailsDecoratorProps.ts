/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useParamsFromRecord } from '../../../../../block-provider/BlockProvider';
import {
  useCollectionParentRecordData,
  useCollectionRecordData,
} from '../../../../../data-source/collection-record/CollectionRecordProvider';

/**
 * 应用在通过 Current record 选项创建的区块中（弹窗中的 Add block 菜单）
 * @param props
 * @returns
 */
export function useDetailsDecoratorProps(props) {
  const params = useParamsFromRecord(props);
  let parentRecord;

  // association 的值是固定不变的，所以可以在条件中使用 hooks
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parentRecord = useDetailsParentRecord(props.association);
  }

  return {
    params,
    parentRecord,
  };
}

export function useDetailsParentRecord(association: string) {
  const fieldSchema = useFieldSchema();
  const recordData = useCollectionRecordData();
  const parentRecordData = useCollectionParentRecordData();

  if (!association) return;

  if (fieldSchema['x-is-current']) {
    return parentRecordData;
  }

  return recordData;
}
