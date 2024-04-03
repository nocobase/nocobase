import { useParentRecordCommon } from '../../../useParentRecordCommon';
import { useGridCardBlockParams } from './useGridCardBlockParams';

export function useGridCardBlockDecoratorProps(props) {
  const params = useGridCardBlockParams(props);
  let parentRecord;

  // 因为 association 是固定的，所以可以在条件中使用 hooks
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parentRecord = useParentRecordCommon(props.association);
  }

  return {
    params,
    parentRecord,
  };
}
