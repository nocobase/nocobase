import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { createContext, useContext, type Context } from 'react';

export interface DetailRouteState {
  readonly routes: readonly AppClientRegisteredRoute[];
  readonly denied: ReadonlySet<string>;
  readonly loading: boolean;
}

export const DetailRouteContext: Context<DetailRouteState> =
  createContext<DetailRouteState>({
    routes: [],
    denied: new Set(),
    loading: true,
  });

export function useRouteTree(): readonly AppClientRegisteredRoute[] {
  return useContext(DetailRouteContext).routes;
}

export function useRouteAccess(): DetailRouteState {
  return useContext(DetailRouteContext);
}
