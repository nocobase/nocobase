import { useContext } from 'react';
import { FilterContext } from './context';

export const useFilterContext = () => {
  const ctx = useContext(FilterContext);
  return {
    ...ctx,
  };
};
