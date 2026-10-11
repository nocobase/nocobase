import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { MemberRolesPanel } from './members/member-roles-panel.js';

/**
 * `/config/members`: everyone who uses Studio, system administrators aside, with their roles, and the pending
 * invitations. Roles themselves are the next page (`/config/roles`). Who may change what is the `pm.members` settings
 * item (`assign`, `invite`, `define-roles`), checked again by every endpoint.
 */
export default function MembersSettingsPage(): ReactElement {
  return (
    <>
      <MemberRolesPanel />
      <Outlet />
    </>
  );
}
