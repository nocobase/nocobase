import { createContext } from 'react';
import type { RouteProps } from './types';

export const RouteSwitchContext = createContext({
  components: {},
  routes: [],
});

export const RouteContext = createContext<RouteProps>(null);
