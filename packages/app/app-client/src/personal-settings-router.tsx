import {
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  createPath,
  parsePath,
  useHref,
  useLocation,
  useNavigate,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
  type Navigator,
  type Path,
  type To,
} from 'react-router';
import { PERSONAL_SETTINGS_ROUTE_PATH as root } from './plugins.js';

import {
  NavigationGuardContext,
  runNavigationGuards,
  useNavigationGuard,
  type NavigationGuard,
} from './navigation-guard.js';

import {
  parameter,
  overlaySearch,
  settingsPath,
  overlayEntry,
  overlayState,
} from './personal-settings-navigation.js';

const emptyMatches = { outlet: null, matches: [], isDataRoute: false };

/** Render the registered /me route tree inside a dialog while keeping browser history on its background page. */
export function PersonalSettingsDialogRoutes({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const outer = useLocation();
  const navigate = useNavigate();
  const backgroundHref = useHref({ pathname: outer.pathname });
  const baseHref = useHref('/');
  const navigation = useContext(UNSAFE_NavigationContext);
  const location = useContext(UNSAFE_LocationContext);
  const value = new URLSearchParams(outer.search).get(parameter) ?? '';
  const inner = parsePath(root + '/' + value);
  const navigator = useMemo<Navigator>(() => {
    function destination(to: To, forHref: boolean) {
      const path = typeof to === 'string' ? parsePath(to) : to;
      if (!settingsPath(path.pathname ?? '')) {
        return forHref
          ? { ...path, pathname: baseHref.replace(/\/$/, '') + path.pathname }
          : path;
      }
      const target = createPath(path).slice(root.length).replace(/^\//, '');
      return {
        pathname: forHref ? backgroundHref : outer.pathname,
        search: overlaySearch(outer.search, target),
        hash: outer.hash,
      };
    }
    function visit(replace: boolean): Navigator['push'] {
      return (to, state: unknown, options) => {
        const personal = settingsPath(
          (typeof to === 'string' ? parsePath(to) : to).pathname ?? '',
        );
        void navigate(destination(to, false), {
          ...options,
          replace: personal || replace,
          state: personal ? overlayState(outer, { pageState: state }) : state,
          preventScrollReset: personal || options?.preventScrollReset,
        });
      };
    }
    return {
      createHref: (to) => createPath(destination(to, true)),
      push: visit(false),
      replace: visit(true),
      go: (delta) => {
        void navigate(delta);
      },
    };
  }, [baseHref, backgroundHref, outer, navigate]);
  const path: Path = {
    pathname: inner.pathname ?? root,
    search: inner.search ?? '',
    hash: inner.hash ?? '',
  };
  return (
    <UNSAFE_NavigationContext.Provider
      value={{ ...navigation, basename: '/', navigator }}
    >
      <UNSAFE_LocationContext.Provider
        value={{
          ...location,
          location: {
            ...path,
            key: outer.key,
            state: overlayEntry(outer).pageState ?? null,
          },
        }}
      >
        <UNSAFE_RouteContext.Provider value={emptyMatches}>
          {children}
        </UNSAFE_RouteContext.Provider>
      </UNSAFE_LocationContext.Provider>
    </UNSAFE_NavigationContext.Provider>
  );
}

/** Keep the underlying page mounted and consult its leave guards only when leaving its own URL. */
export function PersonalSettingsBackground({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const location = useContext(UNSAFE_LocationContext);
  const [guards] = useState(() => new Set<NavigationGuard>());
  const current = location.location;
  const params = new URLSearchParams(current.search);
  const modal = params.has(parameter) && !settingsPath(current.pathname);
  useNavigationGuard((attempt) => {
    const dest = attempt.destination;
    if (
      dest &&
      (modal || new URLSearchParams(dest.search).has(parameter)) &&
      !settingsPath(current.pathname) &&
      (dest.pathname ?? current.pathname) === current.pathname &&
      (dest.hash ?? '') === current.hash &&
      overlaySearch(dest.search ?? '', null) ===
        overlaySearch(current.search, null)
    )
      return true;
    return runNavigationGuards(guards, attempt);
  });
  const background = useMemo(
    () =>
      modal
        ? {
            ...location,
            location: {
              ...current,
              key: overlayEntry(current).backgroundKey,
              state: overlayEntry(current).backgroundState,
              search: overlaySearch(current.search, null),
            },
          }
        : location,
    [modal, current, location],
  );
  return (
    <NavigationGuardContext.Provider value={guards}>
      <UNSAFE_LocationContext.Provider value={background}>
        {children}
      </UNSAFE_LocationContext.Provider>
    </NavigationGuardContext.Provider>
  );
}
