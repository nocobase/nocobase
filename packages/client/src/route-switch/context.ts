import { createContext } from 'react';
import { RouteProps } from './types';

export const RouteSwitchContext = createContext({
  components: {},
});

export const RouteContext = createContext<RouteProps>(null);
