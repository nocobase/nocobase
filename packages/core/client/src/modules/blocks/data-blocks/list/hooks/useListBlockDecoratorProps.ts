import { useDataBlockSourceId } from '../../../../../block-provider/hooks/useDataBlockSourceId';

export function useListBlockDecoratorProps(props) {
  let sourceId;

  // 因为 association 的值是固定的，所以这里可以使用 hooks
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sourceId = useDataBlockSourceId({ association: props.association });
  }

  return {
    sourceId,
  };
}
