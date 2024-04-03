import { useFieldSchema } from '@formily/react';
import { useParamsFromRecord } from '../../../../../block-provider/BlockProvider';
import {
  useCollectionParentRecordData,
  useCollectionRecordData,
} from '../../../../../data-source/collection-record/CollectionRecordProvider';
import { useSourceKey } from '../../../useSourceKey';

/**
 * 应用在通过 Current record 选项创建的区块中（弹窗中的 Add block 菜单）
 * @param props
 * @returns
 */
export function useDetailsDecoratorProps(props) {
  const params = useParamsFromRecord();
  let sourceId;

  // association 的值是固定不变的，所以可以在条件中使用 hooks
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sourceId = useDetailsSourceId(props.association);
  }

  return {
    params,
    sourceId,
  };
}

export function useDetailsSourceId(association: string) {
  const fieldSchema = useFieldSchema();
  const recordData = useCollectionRecordData();
  const parentRecordData = useCollectionParentRecordData();
  const sourceKey = useSourceKey(association);

  if (!association) return;

  if (fieldSchema['x-is-current']) {
    return parentRecordData?.[sourceKey];
  }

  return recordData?.[sourceKey];
}
