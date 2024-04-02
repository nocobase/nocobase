import { useCollectionParentRecordData } from '../../../../../data-source/collection-record/CollectionRecordProvider';
import { useParamsFromRecord } from '../../../../../block-provider/BlockProvider';
import { useCollectionManager } from '../../../../../data-source/collection/CollectionManagerProvider';
import { InheritanceCollectionMixin } from '../../../../../collection-manager/mixins/InheritanceCollectionMixin';

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
    sourceId = useSourceId(props.association);
  }

  return {
    params,
    sourceId,
  };
}

function useSourceId(association: string) {
  const parentRecordData = useCollectionParentRecordData();
  const cm = useCollectionManager();

  // 通过 Current record 选项创建的区块，如果有 association，则说明该弹窗是通过直接点击一个关系字段打开的，
  // 此时需要通过 parentRecordData 才能获取到正确的 sourceId
  if (!association) return;

  const associationField = cm.getCollectionField(association);
  const associationCollection = cm.getCollection<InheritanceCollectionMixin>(associationField.collectionName);

  return parentRecordData?.[
    associationField.sourceKey || associationCollection.filterTargetKey || associationCollection.getPrimaryKey() || 'id'
  ];
}
