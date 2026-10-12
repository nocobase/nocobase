import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router';

import {
  accountCategory,
  withAccountCategory,
} from '../../account/categories.js';
import { useReturnLocations } from '../../layouts/return-locations.js';

/**
 * Routes `/account` and `/account/:category`: deep links into the person's own settings, which are a dialog
 * (`account/account-dialog.tsx`). They open it on that category (the first one when it is missing or unknown) over the
 * page the person was on, or over home when the link was visited directly.
 */
export default function AccountSettingsRoute(): ReactElement {
  const { pathname } = useLocation();
  const { beforeAccount } = useReturnLocations();
  const id = pathname.replace(/^\/account\/?/u, '').split('/')[0] ?? '';
  return (
    <Navigate
      replace
      to={{
        pathname: beforeAccount.pathname,
        search: withAccountCategory(
          beforeAccount.search,
          accountCategory(id).id,
        ),
      }}
    />
  );
}
