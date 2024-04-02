import { useParamsFromRecord } from '../../../../../block-provider/BlockProvider';
import { useDataBlockSourceId } from '../../../../../block-provider/hooks/useDataBlockSourceId';

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
    sourceId = useDataBlockSourceId({ association: props.association });
  }

  return {
    params,
    sourceId,
  };
};
