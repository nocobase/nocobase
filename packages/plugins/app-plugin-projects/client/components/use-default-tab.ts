import { matchPath, useLocation, useResolvedPath } from 'react-router';

/**
 * Whether the page is open at its own URL (no tab chosen), so it should redirect to its default tab
 * (`child-routes.md`). Matching the resolved path in full keeps an explicit tab URL — even an unknown one — where
 * it is.
 */
export function useIsParentEntry(): boolean {
  const location = useLocation();
  const parentPath = useResolvedPath('.');
  return (
    matchPath({ path: parentPath.pathname, end: true }, location.pathname) !==
    null
  );
}
