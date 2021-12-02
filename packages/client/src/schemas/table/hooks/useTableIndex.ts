import { useContext } from 'react';
import { useTable } from './useTable';
import { TableRowContext } from '../context';

export const useTableIndex = () => {
  const { pagination, props } = useTable();
  const ctx = useContext(TableRowContext);
  const { pageSize, page = 1 } = pagination;
  console.log({ pageSize, page }, ctx.index);
  return ctx.index + (page - 1) * pageSize;
  if (pagination && !props.clientSidePagination) {
    const { pageSize, page = 1 } = pagination;
    return ctx.index + (page - 1) * pageSize;
  }
  return ctx.index;
};
