import { useParentRecordCommon } from '@nocobase/client';
import { useCalendarBlockParams } from './useCalendarBlockParams';

export function useCalendarBlockDecoratorProps(props) {
  const params = useCalendarBlockParams(props);
  let parentRecord;

  // 因为 association 是一个固定的值，所以可以在 hooks 中直接使用
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parentRecord = useParentRecordCommon(props.association);
  }

  return {
    params,
    parentRecord,
  };
}
