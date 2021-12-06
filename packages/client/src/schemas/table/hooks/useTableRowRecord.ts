import { useContext } from 'react';
import { TableRowContext } from '../context';

export const useTableRowRecord = () => {
  const ctx = useContext(TableRowContext);
  return ctx.record;
};
