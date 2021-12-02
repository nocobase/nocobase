import { useContext } from 'react';
import {TableContext} from '../context';

export const useTable = () => {
  return useContext(TableContext);
};
