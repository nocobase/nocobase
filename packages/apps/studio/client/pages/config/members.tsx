import type { ReactElement } from 'react';
import { Outlet } from 'react-router';
import { useCan } from '@nocobase/app-plugin-authorization/client';

import { MemberRolesPanel } from './members/member-roles-panel.js';

/** The account directory requires user/read; password deep links check their own action. */
export default function MembersSettingsPage(): ReactElement {
  const read = useCan({ resource: { type: 'user', id: '*' }, action: 'read' });
  return (
    <>
      {read.can ? <MemberRolesPanel /> : null}
      <Outlet />
    </>
  );
}
