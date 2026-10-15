import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router';

/** Preserve old task links, including their selection, filters and nested pages. */
export default function LegacyMyIssues(): ReactElement {
  const location = useLocation();
  const pathname = location.pathname.replace(
    /^\/my-issues\/(?:owned|executing)(?=\/|$)/u,
    '/my-issues',
  );
  return (
    <Navigate
      replace
      to={{
        pathname,
        search: location.search,
        hash: location.hash,
      }}
    />
  );
}
