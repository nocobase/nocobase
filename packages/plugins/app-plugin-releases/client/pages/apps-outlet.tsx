/**
 * The Apps path (`/releases` by default) has no page of its own: an App's page (`:appId`) and a deployment request
 * (`requests/:requestId`, kept for links to it) open below it, and Create App's old address (`new`) leads to the
 * environments. The address alone leads to the environments, where an environment's page lists its Apps.
 */
import type { ReactElement } from 'react';
import { Navigate, useOutlet } from 'react-router';

import { useReleasesPaths } from '../lib/paths.js';

export default function AppsOutlet(): ReactElement {
  const outlet = useOutlet();
  const paths = useReleasesPaths();
  return outlet ?? <Navigate replace to={paths.environments} />;
}
