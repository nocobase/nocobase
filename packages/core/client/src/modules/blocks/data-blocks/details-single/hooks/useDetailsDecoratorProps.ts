import { useParamsFromRecord } from '../../../../../block-provider/BlockProvider';
import { useDataBlockSourceId } from '../../../../../block-provider/hooks/useDataBlockSourceId';

export function useDetailsDecoratorProps(props) {
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
}
