import { createContext, useContext, useMemo, useState } from 'react';
import type { Path } from 'react-router';

import { withAccountCategory } from '../account/categories.js';
import { isSettingsPath } from '../pages/config/sections.js';

type Place = Pick<Path, 'pathname' | 'search'>;

/** Where the settings and the record pages send the person back to; the layout (`app-layout.tsx`) follows the locations it renders. */
export interface ReturnLocations {
  /** The last page outside the workspace settings (`/config`): their navigation's Back. */
  readonly beforeSettings: Place;
  /** The last page outside `/account`: what the account settings dialog opens over. */
  readonly beforeAccount: Place;
  /** The issues list (`/issues`) as last seen, with its view, filters and search: an issue's trail leads back to it. */
  readonly issuesList: Place;
  /** The projects list (`/projects`) as last seen. */
  readonly projectsList: Place;
  /** Each project's page (`/projects/:projectId/<tab>`) as last seen, by project id. */
  readonly projectPages: Readonly<Record<string, Place>>;
}

const HOME: Place = { pathname: '/', search: '' };
const ISSUES: Place = { pathname: '/issues', search: '' };
const PROJECTS: Place = { pathname: '/projects', search: '' };

export const ReturnLocationsContext = createContext<ReturnLocations>({
  beforeSettings: HOME,
  beforeAccount: HOME,
  issuesList: ISSUES,
  projectsList: PROJECTS,
  projectPages: {},
});

export function useReturnLocations(): ReturnLocations {
  return useContext(ReturnLocationsContext);
}

/** The project page `projectId` as last seen, or its bare address (which opens Overview). */
export function projectPageLocation(
  locations: ReturnLocations,
  projectId: string,
): Place {
  return (
    locations.projectPages[projectId] ?? {
      pathname: `/projects/${encodeURIComponent(projectId)}`,
      search: '',
    }
  );
}

export function isAccountPath(pathname: string): boolean {
  return pathname === '/account' || pathname.startsWith('/account/');
}

function same(a: Place, b: Place): boolean {
  return a.pathname === b.pathname && a.search === b.search;
}

/** The last location, among those rendered, that `skip` does not exclude; `initial` until there is one. */
function useLastLocation(
  location: Place,
  skip: (pathname: string) => boolean,
  initial: Place = HOME,
): Place {
  const [last, setLast] = useState(initial);
  if (!skip(location.pathname) && !same(last, location))
    setLast({ pathname: location.pathname, search: location.search });
  return last;
}

/** A list's state as the person left it: the location without the account dialog opened over it. */
function listPlace(location: Place): Place {
  return {
    pathname: location.pathname,
    search: withAccountCategory(location.search, null),
  };
}

/** The project and the tab a location shows: `/projects/:projectId/<tab>`, not a dialog over it (`…/new-issue`). */
function projectPageOf(
  pathname: string,
): { readonly projectId: string } | null {
  const match = /^\/projects\/([^/]+)\/([^/]+)\/?$/u.exec(pathname);
  if (!match || match[1] === 'new') return null;
  return { projectId: decodeURIComponent(match[1]) };
}

export function useTrackReturnLocations(location: Place): ReturnLocations {
  const beforeSettings = useLastLocation(
    location,
    (pathname) => isSettingsPath(pathname) || isAccountPath(pathname),
  );
  const beforeAccount = useLastLocation(location, isAccountPath);
  const list = listPlace(location);
  const issuesList = useLastLocation(
    list,
    (pathname) => pathname !== '/issues',
    ISSUES,
  );
  const projectsList = useLastLocation(
    list,
    (pathname) => pathname !== '/projects',
    PROJECTS,
  );
  const [projectPages, setProjectPages] = useState<
    Readonly<Record<string, Place>>
  >({});
  const page = projectPageOf(list.pathname);
  if (page) {
    const seen = projectPages[page.projectId];
    if (!seen || !same(seen, list))
      setProjectPages({ ...projectPages, [page.projectId]: list });
  }
  return useMemo(
    () => ({
      beforeSettings,
      beforeAccount,
      issuesList,
      projectsList,
      projectPages,
    }),
    [beforeSettings, beforeAccount, issuesList, projectsList, projectPages],
  );
}
