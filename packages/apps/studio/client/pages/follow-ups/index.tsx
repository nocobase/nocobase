/** Legacy personal follow-up links retain selection, task query and fragment in the unified workspace. */
import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router';

import { legacyFollowUpsLocation } from '../../follow-ups/workspace-state.js';

export default function FollowUpsPage(): ReactElement {
  const { search, hash } = useLocation();
  return <Navigate replace to={legacyFollowUpsLocation(search, hash)} />;
}
