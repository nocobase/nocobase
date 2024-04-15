import { useParentRecordCommon } from '../../../useParentRecordCommon';
import { useDetailsWithPaginationBlockParams } from './useDetailsWithPaginationBlockParams';

export function useDetailsWithPaginationDecoratorProps(props) {
  let parentRecord;

  const params = useDetailsWithPaginationBlockParams(props);

  // association 的值是固定不变的，所以可以在条件中使用 hooks
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parentRecord = useParentRecordCommon(props.association);
  }

  return {
    parentRecord,
    params,
  };
}
