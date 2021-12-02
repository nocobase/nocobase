import React, { useContext } from 'react';
import { TableRowContext } from '../context';

export const useTableRow = () => {
  return useContext(TableRowContext);
};
