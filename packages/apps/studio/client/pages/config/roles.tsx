import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { RolesPanel } from './members/roles-panel.js';

/**
 * `/config/roles`: Studio's roles, each opening as the covering page `:roleKey`. Behind `pm.members/read`, like the
 * members tab; creating and editing roles needs `define-roles`.
 */
export default function RolesSettingsPage(): ReactElement {
  return (
    <>
      <RolesPanel />
      <Outlet />
    </>
  );
}
