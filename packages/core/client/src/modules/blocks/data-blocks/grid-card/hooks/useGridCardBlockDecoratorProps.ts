import { useDataBlockSourceId } from '../../../../../block-provider/hooks/useDataBlockSourceId';
import { useGridCardBlockParams } from './useGridCardBlockParams';

export function useGridCardBlockDecoratorProps(props) {
  const params = useGridCardBlockParams(props);
  let sourceId;

  // 因为 association 是固定的，所以可以在条件中使用 hooks
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sourceId = useDataBlockSourceId({ association: props.association });
  }

  return {
    params,
    sourceId,
  };
}
