import { createContext, useCallback, useState } from 'react';
import { useLocation } from 'react-router';

/** The table reports loaded matching data so its parent can place the existing create action once. */
export const TableCreateStateContext = createContext<
  ((visible: boolean) => void) | undefined
>(undefined);

export function useTableCreateState() {
  const location = useLocation();
  const key = `${location.pathname}${location.search}`;
  const [state, setState] = useState<{ key: string; visible: boolean }>();
  const report = useCallback(
    (visible: boolean) => {
      setState((current) =>
        current?.key === key && current.visible === visible
          ? current
          : { key, visible },
      );
    },
    [key],
  );
  return { report, visible: state?.key === key && state.visible };
}
