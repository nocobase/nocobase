/**
 * Create App's old address below the Apps page (`new`): an App is now created from its environment's page, so the
 * address leads there (`newAppTarget`).
 */
import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router';

import { newAppTarget, useReleasesPaths } from '../lib/paths.js';

export default function NewAppRedirect(): ReactElement {
  const { search } = useLocation();
  return <Navigate replace to={newAppTarget(search, useReleasesPaths())} />;
}
