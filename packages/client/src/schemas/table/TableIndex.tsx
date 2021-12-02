import React from 'react';
import { observer } from '@formily/react';
import { useTableIndex } from './hooks/useTableIndex';

export const TableIndex = observer(() => {
  const index = useTableIndex();
  return <span className={'nb-table-index'}>{index + 1}</span>;
});
