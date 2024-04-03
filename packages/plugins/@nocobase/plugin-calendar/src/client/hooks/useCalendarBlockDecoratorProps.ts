import { useSourceIdCommon } from '@nocobase/client';
import { useCalendarBlockParams } from './useCalendarBlockParams';

export function useCalendarBlockDecoratorProps(props) {
  const params = useCalendarBlockParams(props);
  let sourceId: string;

  // 因为 association 是一个固定的值，所以可以在 hooks 中直接使用
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sourceId = useSourceIdCommon(props.association);
  }

  return {
    params,
    sourceId,
  };
}
