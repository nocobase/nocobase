/**
 * Where the plugin's pages are mounted, so one page can link to another: an environment's page to its Apps, an App's
 * page to its environment. The plugin's own routes provide what they were given; an application that routes the pages
 * itself (`releases({ routes: false })`) provides `ReleasesPathsContext` around them when its paths differ from these.
 */
import {
  createContext,
  createElement,
  useContext,
  type ComponentType,
  type Context,
  type ReactElement,
} from 'react';

export interface ReleasesPaths {
  /** App-relative path of the Apps page; an App is `<apps>/<appId>`. */
  readonly apps: string;
  /** App-relative path of the environments page; an environment is `<environments>/<environmentId>`. */
  readonly environments: string;
}

export const DEFAULT_RELEASES_PATHS: ReleasesPaths = {
  apps: '/releases',
  environments: '/release-environments',
};

export const ReleasesPathsContext: Context<ReleasesPaths> =
  createContext<ReleasesPaths>(DEFAULT_RELEASES_PATHS);

export interface ReleasesLinks {
  app(appId: string): string;
  environment(environmentId: string): string;
}

/** Where the Apps and environments pages are mounted. */
export function useReleasesPaths(): ReleasesPaths {
  return useContext(ReleasesPathsContext);
}

/** Links to an App's and an environment's page. */
export function useReleasesLinks(): ReleasesLinks {
  const paths = useContext(ReleasesPathsContext);
  return {
    app: (appId) => `${paths.apps}/${encodeURIComponent(appId)}`,
    environment: (environmentId) =>
      `${paths.environments}/${encodeURIComponent(environmentId)}`,
  };
}

/** `component` with the pages at `paths`, for routes that mount them elsewhere than the defaults. */
export function withReleasesPaths(
  component: ComponentType,
  paths: ReleasesPaths,
): ComponentType {
  function WithReleasesPaths(): ReactElement {
    return createElement(
      ReleasesPathsContext.Provider,
      { value: paths },
      createElement(component),
    );
  }
  return WithReleasesPaths;
}
