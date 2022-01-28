import { createContext } from 'react';

export const VisibleContext = createContext<[boolean, any]>([false, () => {}]);
