import { useCollectionRecordData } from '../../../../../data-source/collection-record/CollectionRecordProvider';
import { useParamsFromRecord } from '../../../../../block-provider/BlockProvider';
import { useCollectionManager } from '../../../../../data-source/collection/CollectionManagerProvider';
import { InheritanceCollectionMixin } from '../../../../../collection-manager/mixins/InheritanceCollectionMixin';

/**
 * 应用在通过 Association records 选项创建的区块中（弹窗中的 Add block 菜单）
 * @param props
 * @returns
 */
export const useDetailsByAssociationRecordDecoratorProps = (props) => {
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
};

function useSourceId(association: string) {
  const recordData = useCollectionRecordData();
  const cm = useCollectionManager();

  if (!association) return;

  const associationField = cm.getCollectionField(association);
  const associationCollection = cm.getCollection<InheritanceCollectionMixin>(associationField.collectionName);

  return recordData?.[
    associationField.sourceKey || associationCollection.filterTargetKey || associationCollection.getPrimaryKey() || 'id'
  ];
}
