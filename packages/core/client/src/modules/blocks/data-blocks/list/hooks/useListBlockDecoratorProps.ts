import { useParentRecordCommon } from '../../../useParentRecordCommon';

export function useListBlockDecoratorProps(props) {
  let parentRecord;

  // 因为 association 的值是固定的，所以这里可以使用 hooks
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parentRecord = useParentRecordCommon(props.association);
  }

  return {
    parentRecord,
  };
}
