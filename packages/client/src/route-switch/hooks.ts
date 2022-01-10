import { useContext } from 'react';
import get from 'lodash/get';
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
