// @ts-nocheck
import type { RouterState } from '@remix-run/router';
import React from 'react';
import {
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
  UNSAFE_LocationContext as LocationContext,
  UNSAFE_RouteContext as RouteContext,
  Router,
  UNSAFE_useRoutesImpl as useRoutesImpl,
  type DataRouteObject,
  type RouterProviderProps,
} from 'react-router';
import { compose } from '../compose';

const START_TRANSITION = 'startTransition';

/**
 * Given a Remix Router instance, render the appropriate UI
 */
export function RouterProvider({
  fallbackElement,
  router,
  providers,
}: RouterProviderProps & { providers?: any }): React.ReactElement {
  // Need to use a layout effect here so we are subscribed early enough to
  // pick up on any render-driven redirects/navigations (useEffect/<Navigate>)
  const [state, setStateImpl] = React.useState(router.state);
  const setState = React.useCallback(
    (newState: RouterState) => {
      START_TRANSITION in React ? React[START_TRANSITION](() => setStateImpl(newState)) : setStateImpl(newState);
    },
    [setStateImpl],
  );
  React.useLayoutEffect(() => router.subscribe(setState), [router, setState]);

  const navigator = React.useMemo((): Navigator => {
    return {
      createHref: router.createHref,
      encodeLocation: router.encodeLocation,
      go: (n) => router.navigate(n),
      push: (to, state, opts) =>
        router.navigate(to, {
          state,
          preventScrollReset: opts?.preventScrollReset,
        }),
      replace: (to, state, opts) =>
        router.navigate(to, {
          replace: true,
          state,
          preventScrollReset: opts?.preventScrollReset,
        }),
    };
  }, [router]);

  const basename = router.basename || '/';

  const dataRouterContext = React.useMemo(
    () => ({
      router,
      navigator,
      static: false,
      basename,
    }),
    [router, navigator, basename],
  );
  const Providers = compose(...providers)((props) => <>{props.children}</>);
  // The fragment and {null} here are important!  We need them to keep React 18's
  // useId happy when we are server-rendering since we may have a <script> here
  // containing the hydrated server-side staticContext (from StaticRouterProvider).
  // useId relies on the component tree structure to generate deterministic id's
  // so we need to ensure it remains the same on the client even though
  // we don't need the <script> tag
  return (
    <>
      <RouterContextCleaner>
        <DataRouterContext.Provider value={dataRouterContext}>
          <DataRouterStateContext.Provider value={state}>
            <Router
              basename={basename}
              location={state.location}
              navigationType={state.historyAction}
              navigator={navigator}
            >
              <Providers>
                {state.initialized ? <DataRoutes routes={router.routes} state={state} /> : fallbackElement}
              </Providers>
            </Router>
          </DataRouterStateContext.Provider>
        </DataRouterContext.Provider>
      </RouterContextCleaner>
      {null}
    </>
  );
}

export function DataRoutes({
  routes,
  state,
}: {
  routes: DataRouteObject[];
  state: RouterState;
}): React.ReactElement | null {
  return useRoutesImpl(routes, undefined, state);
}

export const RouterContextCleaner = (props) => {
  return (
    <RouteContext.Provider
      value={{
        outlet: null,
        matches: [],
        isDataRoute: false,
      }}
    >
      <LocationContext.Provider value={null as any}>{props.children}</LocationContext.Provider>
    </RouteContext.Provider>
  );
};
