import { useCallback } from 'react';

export const useGetAriaLabelOfBlockItem = () => {
  const getAriaLabel = useCallback(() => {}, []);

  return {
    getAriaLabel,
  };
};
