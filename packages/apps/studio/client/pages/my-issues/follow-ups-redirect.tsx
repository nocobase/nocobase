import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router';

/**
 * Retain bookmarked My follow-ups links while removing the page: My tasks lists the followed tasks first, and its split
 * view selects the task `?issue=` names, as My follow-ups did.
 */
export default function FollowUpsRedirect(): ReactElement {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: '/my-issues', search, hash }} replace />;
}
