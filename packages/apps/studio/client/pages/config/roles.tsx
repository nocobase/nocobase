import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { RolesPanel } from './members/roles-panel.js';

/**
 * `/config/roles`: Studio's roles, each opening as the covering page `:roleKey`. Reading definitions requires `studio.roles/read`;
 * creating and editing definitions requires `studio.roles/manage`.
 */
export default function RolesSettingsPage(): ReactElement {
  return (
    <>
      <RolesPanel />
      <Outlet />
    </>
  );
}
