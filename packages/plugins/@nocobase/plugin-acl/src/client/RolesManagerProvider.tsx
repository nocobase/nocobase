import { createContext } from 'react';

export const RolesManagerContext = createContext<{
  role: any;
  setRole: (role: any) => void;
}>({
  role: null,
} as any);
RolesManagerContext.displayName = 'RolesManagerContext';
