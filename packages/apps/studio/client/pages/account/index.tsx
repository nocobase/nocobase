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
 * page the person was on, or over home when the link was visited directly. The link's own query goes along, for the
 * category to read: the code host sends the person back to `/account/git?connected=1` or `?error=<code>`.
 */
export default function AccountSettingsRoute(): ReactElement {
  const { pathname, search } = useLocation();
  const { beforeAccount } = useReturnLocations();
  const id = pathname.replace(/^\/account\/?/u, '').split('/')[0] ?? '';
  const params = new URLSearchParams(beforeAccount.search);
  for (const [key, value] of new URLSearchParams(search))
    params.set(key, value);
  return (
    <Navigate
      replace
      to={{
        pathname: beforeAccount.pathname,
        search: withAccountCategory(params.toString(), accountCategory(id).id),
      }}
    />
  );
}
