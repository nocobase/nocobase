import React from 'react';
import { Pagination } from 'antd';
import { observer } from '@formily/react';
import { useTable } from './hooks/useTable';
import { useTotal } from './hooks/useTotal';

export const TablePagination = observer(() => {
  const { service, pagination, setPagination, props } = useTable();
  if (!pagination || Object.keys(pagination).length === 0) {
    return null;
  }
  const { clientSidePagination } = props;
  const total = useTotal();
  const { page = 1 } = pagination;
  return (
    <div style={{ marginTop: 16 }}>
      <Pagination
        {...pagination}
        showSizeChanger
        current={page}
        total={total}
        onChange={(current, pageSize) => {
          const page = pagination.pageSize !== pageSize ? 1 : current;
          setPagination({
            page,
            pageSize,
          });
          // if (clientSidePagination) {
          //   return;
          // }
          // service.run({
          //   ...service.params[0],
          //   page,
          //   pageSize,
          // });
        }}
      />
    </div>
  );
});
