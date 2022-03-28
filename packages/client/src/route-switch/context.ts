import { createContext } from 'react';
import { RouteProps } from './types';

export const RouteSwitchContext = createContext({
  components: {},
  routes: [],
});

export const RouteContext = createContext<RouteProps>(null);
