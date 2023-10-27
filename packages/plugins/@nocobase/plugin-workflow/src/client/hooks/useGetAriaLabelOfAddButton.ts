import { useCallback } from 'react';

export const useGetAriaLabelOfAddButton = (
  data: {
    type: string;
    title: string;
  },
  branchIndex?: number,
) => {
  const getAriaLabel = useCallback(
    (postfix?: string) => {
      return ['add-button', data?.type, data?.title, branchIndex != null ? String(branchIndex) : '', postfix]
        .filter(Boolean)
        .join('-');
    },
    [branchIndex, data?.title, data?.type],
  );

  return { getAriaLabel };
};
