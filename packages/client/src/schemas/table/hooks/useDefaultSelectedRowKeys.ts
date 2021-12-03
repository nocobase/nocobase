import { useState } from 'react';

export const useDefaultSelectedRowKeys = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>([]);
  return { selectedRowKeys, setSelectedRowKeys };
};
