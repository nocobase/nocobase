import { useMemo } from 'react';
import { useTableBlockContext } from '../../block-provider';
import { VariableOption } from '../types';

const useContextVariable = (): VariableOption => {
  const { field, service, rowKey, collection: collectionName } = useTableBlockContext();
  const contextData = useMemo(
    () => service?.data?.data?.filter((v) => (field?.data?.selectedRowKeys || [])?.includes(v[rowKey])),
    [field?.data?.selectedRowKeys, rowKey, service?.data?.data],
  );

  return useMemo(() => {
    return {
      name: '$context',
      ctx: contextData,
      collectionName,
    };
  }, [collectionName, contextData]);
};

export default useContextVariable;
