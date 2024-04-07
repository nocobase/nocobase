import { useParentRecordCommon } from '../../../useParentRecordCommon';

export function useCreateFormBlockDecoratorProps(props) {
  let parentRecord;

  // association 的值是固定不变的，所以这里可以使用 hooks
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parentRecord = useParentRecordCommon(props.association);
  }

  return {
    parentRecord,
  };
}
