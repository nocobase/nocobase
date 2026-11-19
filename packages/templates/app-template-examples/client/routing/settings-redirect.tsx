import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router';

import { settingsRedirectTarget } from './settings-redirects.js';

/** Sends a former settings URL to its page under `/settings`, keeping the rest of the path, the query and the hash. */
export function SettingsRedirect(): ReactElement {
  const { pathname, search, hash } = useLocation();
  return (
    <Navigate
      replace
      to={{ pathname: settingsRedirectTarget(pathname) ?? '/', search, hash }}
    />
  );
}
