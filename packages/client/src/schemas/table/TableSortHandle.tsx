import React from 'react';
import { observer } from '@formily/react';
import { SortableRowHandle } from './Sortable';

export const TableSortHandle = observer((props: any) => {
  return <SortableRowHandle {...props} />;
});
