import { useFormBlockSourceId } from './useFormBlockSourceId';

export function useCreateFormBlockDecoratorProps(props) {
  let sourceId;

  // association 的值是固定不变的，所以这里可以使用 hooks
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sourceId = useFormBlockSourceId(props);
  }

  return {
    sourceId,
  };
}
