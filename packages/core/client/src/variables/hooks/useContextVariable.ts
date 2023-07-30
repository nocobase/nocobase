import { useMemo } from 'react';
import { useTableBlockContext } from '../../block-provider';
import { useCollection } from '../../collection-manager';
import { VariableOption } from '../VariablesProvider';

const useContextVariable = (): VariableOption => {
  const { name } = useCollection();
  const { field, service, rowKey } = useTableBlockContext();
  const contextData = useMemo(
    () => service?.data?.data?.filter((v) => (field?.data?.selectedRowKeys || [])?.includes(v[rowKey])),
    [field?.data?.selectedRowKeys, rowKey, service?.data?.data],
  );

  return useMemo(() => {
    return {
      name: '$context',
      ctx: contextData,
      collectionName: name,
    };
  }, [contextData, name]);
};

export default useContextVariable;
