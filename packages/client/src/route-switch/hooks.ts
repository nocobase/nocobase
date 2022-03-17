import get from 'lodash/get';
import { useContext } from 'react';
import { RouteContext, RouteSwitchContext } from './context';

export function useRouteComponent(name?: string) {
  if (!name) {
    return () => null;
  }
  const { components } = useContext(RouteSwitchContext);
  return get(components, name) || (() => null);
}

export function useRoute() {
  return useContext(RouteContext);
}

export function useRoutes() {
  const { routes } = useContext(RouteSwitchContext);
  return routes || [];
}
