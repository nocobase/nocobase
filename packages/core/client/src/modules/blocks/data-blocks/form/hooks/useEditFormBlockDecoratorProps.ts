import { useParamsFromRecord } from '../../../../../block-provider/BlockProvider';
import { useDetailsSourceId } from '../../details-single/hooks/useDetailsDecoratorProps';

export function useEditFormBlockDecoratorProps(props) {
  const params = useFormBlockParams();
  let sourceId;

  // association 的值是固定不变的，所以这里可以使用 hooks
  if (props.association) {
    // 复用详情区块的 sourceId 获取逻辑
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sourceId = useDetailsSourceId(props.association);
  }

  return {
    params,
    sourceId,
  };
}

function useFormBlockParams() {
  return useParamsFromRecord();
}
